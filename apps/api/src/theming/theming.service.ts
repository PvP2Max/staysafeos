import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ThemingService {
  constructor(private readonly prisma: PrismaService) {}

  async getTheme(id: string) {
    return this.prisma.theme.findUnique({ where: { id } });
  }

  async createTheme(data: {
    primaryColor: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
  }) {
    return this.prisma.theme.create({ data });
  }

  async updateTheme(
    id: string,
    data: {
      primaryColor?: string;
      backgroundColor?: string | null;
      foregroundColor?: string | null;
      mutedColor?: string | null;
      accentColor?: string | null;
      logoUrl?: string | null;
      faviconUrl?: string | null;
    }
  ) {
    return this.prisma.theme.update({ where: { id }, data });
  }

  async assignThemeToOrg(themeId: string, orgId: string) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { themeId },
    });
  }

  async getThemeByOrgSlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: { theme: true },
    });
    return org?.theme ?? null;
  }
}
