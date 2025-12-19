import { Module } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { TenantsController, OrganizationsController, InternalOrganizationsController } from "./tenants.controller";
import { GlobalStatsModule } from "../global-stats/global-stats.module";

@Module({
  imports: [GlobalStatsModule],
  controllers: [TenantsController, OrganizationsController, InternalOrganizationsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
