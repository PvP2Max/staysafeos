import { Controller, Get, Put, Param, Body, UseGuards } from "@nestjs/common";
import { ThemingService } from "./theming.service";
import { LogtoAuthGuard, Public, Roles } from "../auth/logto-auth.guard";

@Controller("theming")
export class ThemingController {
  constructor(private readonly themingService: ThemingService) {}

  @Get("org/:slug")
  @Public()
  async getThemeByOrgSlug(@Param("slug") slug: string) {
    return this.themingService.getThemeByOrgSlug(slug);
  }

  @Put(":id")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async updateTheme(
    @Param("id") id: string,
    @Body()
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
    return this.themingService.updateTheme(id, data);
  }
}
