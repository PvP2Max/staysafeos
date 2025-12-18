import { Module } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { TenantsController, OrganizationsController, InternalOrganizationsController } from "./tenants.controller";

@Module({
  controllers: [TenantsController, OrganizationsController, InternalOrganizationsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
