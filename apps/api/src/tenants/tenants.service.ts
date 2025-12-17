import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
  ) {}

  async findBySlug(slug: string) {
    return this.prisma.organization.findUnique({
      where: { slug },
      include: {
        theme: true,
        domains: true,
        settings: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        theme: true,
        domains: true,
        settings: true,
      },
    });
  }

  async updateTenant(
    slug: string,
    data: { name?: string; subscriptionTier?: string }
  ) {
    return this.prisma.organization.update({
      where: { slug },
      data,
      include: {
        theme: true,
        domains: true,
      },
    });
  }
}
