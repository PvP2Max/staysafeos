import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { getTemplateWithBranding } from "../tenants/templates/landing-page";

// Helper for setting JSON fields to null in Prisma
const JsonNull = Prisma.JsonNull;

// Editor types supported
export type EditorType = "tiptap" | "grapesjs";

// Create page input
export interface CreatePageInput {
  slug: string;
  title: string;
  editorType?: EditorType;
  blocks?: Prisma.InputJsonValue;
  htmlContent?: string;
  cssContent?: string;
  gjsComponents?: Prisma.InputJsonValue;
  gjsStyles?: Prisma.InputJsonValue;
  templateId?: string;
  isLandingPage?: boolean;
}

// Update page input
export interface UpdatePageInput {
  title?: string;
  published?: boolean;
  editorType?: EditorType;
  blocks?: Prisma.InputJsonValue;
  htmlContent?: string;
  cssContent?: string;
  gjsComponents?: Prisma.InputJsonValue;
  gjsStyles?: Prisma.InputJsonValue;
}

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  // Public methods (by orgId in path)
  async findByOrgAndSlug(organizationId: string, slug: string) {
    return this.prisma.page.findUnique({
      where: {
        organizationId_slug: { organizationId, slug },
      },
    });
  }

  async findAllByOrg(organizationId: string) {
    return this.prisma.page.findMany({
      where: { organizationId },
      orderBy: { slug: "asc" },
    });
  }

  async createPage(data: {
    organizationId: string;
    slug: string;
    title: string;
    blocks?: Prisma.InputJsonValue;
  }) {
    return this.prisma.page.create({
      data: {
        organizationId: data.organizationId,
        slug: data.slug,
        title: data.title,
        blocks: data.blocks ?? [],
      },
    });
  }

  async updatePage(
    organizationId: string,
    slug: string,
    data: { title?: string; blocks?: Prisma.InputJsonValue; published?: boolean }
  ) {
    return this.prisma.page.update({
      where: {
        organizationId_slug: { organizationId, slug },
      },
      data,
    });
  }

  async deletePage(organizationId: string, slug: string) {
    return this.prisma.page.delete({
      where: {
        organizationId_slug: { organizationId, slug },
      },
    });
  }

  // Tenant-context methods (for authenticated dashboard use)
  private getTenantId(): string {
    const tenantId = this.requestContext.organizationId;
    if (!tenantId) {
      throw new ForbiddenException("No tenant context");
    }
    return tenantId;
  }

  async findAllForCurrentTenant() {
    const tenantId = this.getTenantId();
    return this.prisma.page.findMany({
      where: { organizationId: tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        published: true,
        editorType: true,
        isLandingPage: true,
      },
    });
  }

  async findLandingPageForTenant(organizationId: string) {
    return this.prisma.page.findFirst({
      where: {
        organizationId,
        isLandingPage: true,
        published: true,
      },
    });
  }

  async findByIdForCurrentTenant(id: string) {
    const tenantId = this.getTenantId();
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException("Page not found");
    }

    if (page.organizationId !== tenantId) {
      throw new ForbiddenException("Page does not belong to your organization");
    }

    return page;
  }

  async createPageForCurrentTenant(data: CreatePageInput) {
    const tenantId = this.getTenantId();
    return this.prisma.page.create({
      data: {
        organizationId: tenantId,
        slug: data.slug,
        title: data.title,
        editorType: data.editorType ?? "grapesjs",
        blocks: data.blocks ?? [],
        htmlContent: data.htmlContent,
        cssContent: data.cssContent,
        gjsComponents: data.gjsComponents,
        gjsStyles: data.gjsStyles,
        templateId: data.templateId,
        isLandingPage: data.isLandingPage ?? false,
      },
    });
  }

  async updatePageById(id: string, data: UpdatePageInput) {
    const tenantId = this.getTenantId();
    const page = await this.prisma.page.findUnique({ where: { id } });

    if (!page) {
      throw new NotFoundException("Page not found");
    }

    if (page.organizationId !== tenantId) {
      throw new ForbiddenException("Page does not belong to your organization");
    }

    return this.prisma.page.update({
      where: { id },
      data: {
        title: data.title,
        published: data.published,
        editorType: data.editorType,
        blocks: data.blocks,
        htmlContent: data.htmlContent,
        cssContent: data.cssContent,
        gjsComponents: data.gjsComponents,
        gjsStyles: data.gjsStyles,
      },
    });
  }

  async deletePageById(id: string) {
    const tenantId = this.getTenantId();
    const page = await this.prisma.page.findUnique({ where: { id } });

    if (!page) {
      throw new NotFoundException("Page not found");
    }

    if (page.organizationId !== tenantId) {
      throw new ForbiddenException("Page does not belong to your organization");
    }

    return this.prisma.page.delete({ where: { id } });
  }

  async resetPageToTemplate(id: string) {
    const tenantId = this.getTenantId();

    const page = await this.prisma.page.findUnique({ where: { id } });

    if (!page) {
      throw new NotFoundException("Page not found");
    }

    if (page.organizationId !== tenantId) {
      throw new ForbiddenException("Page does not belong to your organization");
    }

    // Get org info for template branding
    const org = await this.prisma.organization.findUnique({
      where: { id: tenantId },
      include: { theme: true },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    const template = getTemplateWithBranding(
      org.name,
      org.theme?.logoUrl,
      org.theme?.primaryColor
    );

    return this.prisma.page.update({
      where: { id },
      data: {
        editorType: "grapesjs",
        htmlContent: template.html,
        cssContent: template.css,
        gjsComponents: JsonNull, // Clear GrapesJS data so it re-parses from HTML
        gjsStyles: JsonNull,
      },
    });
  }
}
