import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

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
}
