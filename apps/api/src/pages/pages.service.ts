import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";

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

  async createPageForCurrentTenant(data: {
    slug: string;
    title: string;
    blocks?: Prisma.InputJsonValue;
  }) {
    const tenantId = this.getTenantId();
    return this.prisma.page.create({
      data: {
        organizationId: tenantId,
        slug: data.slug,
        title: data.title,
        blocks: data.blocks ?? [],
      },
    });
  }

  async updatePageById(
    id: string,
    data: { title?: string; blocks?: Prisma.InputJsonValue; published?: boolean }
  ) {
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
      data,
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
}
