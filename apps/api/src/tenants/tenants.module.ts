import { Module } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { TenantsController, InternalOrganizationsController } from "./tenants.controller";

@Module({
  controllers: [TenantsController, InternalOrganizationsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
