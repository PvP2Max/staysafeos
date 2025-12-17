import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import {
  CreateModuleDto,
  UpdateModuleDto,
  SubmitQuizDto,
  TrainingFilterDto,
  TrainingCategory,
} from "./dto/training.dto";

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Create a training module
   */
  async createModule(dto: CreateModuleDto) {
    const org = this.requestContext.requireOrganization();

    return this.prisma.trainingModule.create({
      data: {
        organizationId: org.id,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        videoUrl: dto.videoUrl,
        videoId: dto.videoId,
        videoDuration: dto.videoDuration,
        quizQuestions: dto.quizQuestions as any,
        passingPercent: dto.passingPercent ?? 80,
        requiredRoles: dto.requiredRoles ?? [],
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      },
    });
  }

  /**
   * Get all training modules
   */
  async getModules(filters: TrainingFilterDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const where: any = {
      organizationId: org.id,
      active: true,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    // If filtering by role, get modules required for that role
    if (filters.role) {
      where.requiredRoles = { has: filters.role };
    }

    const modules = await this.prisma.trainingModule.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    // If user is logged in, get their completion status
    if (membership) {
      const completions = await this.prisma.trainingCompletion.findMany({
        where: {
          membershipId: membership.id,
          trainingModuleId: { in: modules.map((m) => m.id) },
        },
      });

      const completionMap = new Map(
        completions.map((c) => [c.trainingModuleId, c])
      );

      return modules.map((module) => ({
        ...module,
        completion: completionMap.get(module.id) ?? null,
      }));
    }

    return modules;
  }

  /**
   * Get a single module
   */
  async getModule(id: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const module = await this.prisma.trainingModule.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!module) {
      throw new NotFoundException("Training module not found");
    }

    let completion = null;
    if (membership) {
      completion = await this.prisma.trainingCompletion.findUnique({
        where: {
          trainingModuleId_membershipId: {
            trainingModuleId: id,
            membershipId: membership.id,
          },
        },
      });
    }

    return { ...module, completion };
  }

  /**
   * Update a module
   */
  async updateModule(id: string, dto: UpdateModuleDto) {
    const org = this.requestContext.requireOrganization();

    const module = await this.prisma.trainingModule.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!module) {
      throw new NotFoundException("Training module not found");
    }

    return this.prisma.trainingModule.update({
      where: { id },
      data: {
        ...dto,
        quizQuestions: dto.quizQuestions as any,
      },
    });
  }

  /**
   * Delete a module
   */
  async deleteModule(id: string) {
    const org = this.requestContext.requireOrganization();

    const module = await this.prisma.trainingModule.findFirst({
      where: { id, organizationId: org.id },
    });

    if (!module) {
      throw new NotFoundException("Training module not found");
    }

    await this.prisma.trainingModule.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Mark video as watched
   */
  async markVideoWatched(moduleId: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const module = await this.prisma.trainingModule.findFirst({
      where: { id: moduleId, organizationId: org.id },
    });

    if (!module) {
      throw new NotFoundException("Training module not found");
    }

    // Upsert completion record
    const completion = await this.prisma.trainingCompletion.upsert({
      where: {
        trainingModuleId_membershipId: {
          trainingModuleId: moduleId,
          membershipId: membership.id,
        },
      },
      update: {
        videoWatchedAt: new Date(),
      },
      create: {
        trainingModuleId: moduleId,
        membershipId: membership.id,
        videoWatchedAt: new Date(),
      },
    });

    // If no quiz, mark as complete
    if (!module.quizQuestions || (module.quizQuestions as any[]).length === 0) {
      await this.prisma.trainingCompletion.update({
        where: { id: completion.id },
        data: {
          passed: true,
          completedAt: new Date(),
        },
      });

      // Update membership training timestamp
      await this.updateMembershipTraining(membership.id, module.category);
    }

    return completion;
  }

  /**
   * Submit quiz answers
   */
  async submitQuiz(moduleId: string, dto: SubmitQuizDto) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    if (!membership) {
      throw new ForbiddenException("Not authenticated");
    }

    const module = await this.prisma.trainingModule.findFirst({
      where: { id: moduleId, organizationId: org.id },
    });

    if (!module) {
      throw new NotFoundException("Training module not found");
    }

    const questions = module.quizQuestions as any[];
    if (!questions || questions.length === 0) {
      throw new BadRequestException("This module has no quiz");
    }

    // Calculate score
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (dto.answers[i] === questions[i].correctIndex) {
        correct++;
      }
    }

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= module.passingPercent;

    // Update completion record
    const completion = await this.prisma.trainingCompletion.upsert({
      where: {
        trainingModuleId_membershipId: {
          trainingModuleId: moduleId,
          membershipId: membership.id,
        },
      },
      update: {
        quizScore: score,
        quizAttempts: { increment: 1 },
        passed,
        completedAt: passed ? new Date() : null,
      },
      create: {
        trainingModuleId: moduleId,
        membershipId: membership.id,
        quizScore: score,
        quizAttempts: 1,
        passed,
        completedAt: passed ? new Date() : null,
      },
    });

    // Update membership training timestamp if passed
    if (passed) {
      await this.updateMembershipTraining(membership.id, module.category);
    }

    return {
      score,
      passed,
      correct,
      total: questions.length,
      passingPercent: module.passingPercent,
    };
  }

  /**
   * Get user's training progress
   */
  async getProgress(membershipId?: string) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    const targetMembershipId = membershipId ?? membership?.id;
    if (!targetMembershipId) {
      throw new ForbiddenException("Not authenticated");
    }

    // Get all modules for this org
    const modules = await this.prisma.trainingModule.findMany({
      where: { organizationId: org.id, active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    // Get completions
    const completions = await this.prisma.trainingCompletion.findMany({
      where: {
        membershipId: targetMembershipId,
        trainingModuleId: { in: modules.map((m) => m.id) },
      },
    });

    const completionMap = new Map(
      completions.map((c) => [c.trainingModuleId, c])
    );

    // Group by category
    const byCategory: Record<
      string,
      { total: number; completed: number; modules: any[] }
    > = {};

    for (const module of modules) {
      if (!byCategory[module.category]) {
        byCategory[module.category] = { total: 0, completed: 0, modules: [] };
      }

      const completion = completionMap.get(module.id);
      byCategory[module.category].total++;
      if (completion?.passed) {
        byCategory[module.category].completed++;
      }

      byCategory[module.category].modules.push({
        ...module,
        completion,
      });
    }

    return byCategory;
  }

  /**
   * Get night brief video
   */
  async getNightBrief() {
    const org = this.requestContext.requireOrganization();

    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: org.id },
    });

    return {
      videoId: settings?.nightBriefVideoId ?? null,
    };
  }

  /**
   * Check if user has completed required training for a role
   */
  async hasCompletedTrainingForRole(
    membershipId: string,
    role: string
  ): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) return false;

    const categoryMap: Record<string, keyof typeof membership> = {
      SAFETY: "trainingSafetyAt",
      DRIVER: "trainingDriverAt",
      TC: "trainingTcAt",
      DISPATCHER: "trainingDispatcherAt",
    };

    const field = categoryMap[role];
    if (!field) return true; // No training required for this role

    return !!membership[field];
  }

  /**
   * Update membership training timestamp
   */
  private async updateMembershipTraining(membershipId: string, category: string) {
    const fieldMap: Record<string, string> = {
      [TrainingCategory.ORIENTATION]: "trainingOrientationAt",
      [TrainingCategory.SAFETY]: "trainingSafetyAt",
      [TrainingCategory.DRIVER]: "trainingDriverAt",
      [TrainingCategory.TC]: "trainingTcAt",
      [TrainingCategory.DISPATCHER]: "trainingDispatcherAt",
    };

    const field = fieldMap[category];
    if (!field) return;

    // Check if all modules in this category are completed
    const org = this.requestContext.requireOrganization();
    const modules = await this.prisma.trainingModule.findMany({
      where: {
        organizationId: org.id,
        category,
        active: true,
      },
    });

    const completions = await this.prisma.trainingCompletion.findMany({
      where: {
        membershipId,
        trainingModuleId: { in: modules.map((m) => m.id) },
        passed: true,
      },
    });

    // If all modules completed, update membership timestamp
    if (completions.length >= modules.length) {
      await this.prisma.membership.update({
        where: { id: membershipId },
        data: { [field]: new Date() },
      });
    }
  }
}
