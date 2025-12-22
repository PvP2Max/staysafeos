import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { PagesService, CreatePageInput, UpdatePageInput } from "./pages.service";
import { LogtoAuthGuard, Public, Roles } from "../auth/logto-auth.guard";

@Controller("pages")
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // ============================================
  // Tenant-context endpoints (for dashboard use)
  // Uses X-StaySafe-Tenant header for org context
  // ============================================

  @Get()
  @UseGuards(LogtoAuthGuard)
  async getPagesForTenant() {
    return this.pagesService.findAllForCurrentTenant();
  }

  @Post()
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async createPageForTenant(@Body() data: CreatePageInput) {
    return this.pagesService.createPageForCurrentTenant(data);
  }

  @Get(":id")
  @UseGuards(LogtoAuthGuard)
  async getPageById(@Param("id") id: string) {
    // Check if it looks like a page ID (UUID or CUID) vs org slug
    if (this.isPageId(id)) {
      return this.pagesService.findByIdForCurrentTenant(id);
    }
    // Fall through to public route behavior
    return this.pagesService.findAllByOrg(id);
  }

  @Patch(":id")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async updatePageById(@Param("id") id: string, @Body() data: UpdatePageInput) {
    return this.pagesService.updatePageById(id, data);
  }

  @Delete(":id")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async deletePageById(@Param("id") id: string) {
    return this.pagesService.deletePageById(id);
  }

  @Post(":id/reset-template")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async resetPageToTemplate(@Param("id") id: string) {
    return this.pagesService.resetPageToTemplate(id);
  }

  // ============================================
  // Public endpoints (for public page access)
  // Uses orgId/slug in URL path
  // ============================================

  @Get("public/:orgId")
  @Public()
  async getPublicPages(@Param("orgId") orgId: string) {
    return this.pagesService.findAllByOrg(orgId);
  }

  @Get("public/:orgId/:slug")
  @Public()
  async getPublicPage(@Param("orgId") orgId: string, @Param("slug") slug: string) {
    return this.pagesService.findByOrgAndSlug(orgId, slug);
  }

  // Helper to detect page ID format (UUID or CUID)
  private isPageId(str: string): boolean {
    // UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // CUID format (25 chars, starts with 'c', alphanumeric)
    const cuidRegex = /^c[a-z0-9]{24}$/;
    return uuidRegex.test(str) || cuidRegex.test(str);
  }
}
