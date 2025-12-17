import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { PagesService } from "./pages.service";
import { LogtoAuthGuard, Public, Roles } from "../auth/logto-auth.guard";
import { RequestContextService } from "../common/context/request-context.service";

@Controller("pages")
export class PagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly requestContext: RequestContextService
  ) {}

  @Get(":orgId")
  @Public()
  async getPages(@Param("orgId") orgId: string) {
    return this.pagesService.findAllByOrg(orgId);
  }

  @Get(":orgId/:slug")
  @Public()
  async getPage(@Param("orgId") orgId: string, @Param("slug") slug: string) {
    return this.pagesService.findByOrgAndSlug(orgId, slug);
  }

  @Post(":orgId")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async createPage(
    @Param("orgId") orgId: string,
    @Body() data: { slug: string; title: string; blocks?: unknown[] }
  ) {
    return this.pagesService.createPage({
      organizationId: orgId,
      ...data,
    });
  }

  @Put(":orgId/:slug")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async updatePage(
    @Param("orgId") orgId: string,
    @Param("slug") slug: string,
    @Body() data: { title?: string; blocks?: unknown[]; published?: boolean }
  ) {
    return this.pagesService.updatePage(orgId, slug, data);
  }

  @Delete(":orgId/:slug")
  @UseGuards(LogtoAuthGuard)
  @Roles("EXECUTIVE", "ADMIN")
  async deletePage(
    @Param("orgId") orgId: string,
    @Param("slug") slug: string
  ) {
    return this.pagesService.deletePage(orgId, slug);
  }
}
