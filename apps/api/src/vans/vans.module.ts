import { Module } from "@nestjs/common";
import { VansController } from "./vans.controller";
import { VansService } from "./vans.service";
import { PrismaModule } from "../prisma/prisma.module";
import { OsrmModule } from "../osrm/osrm.module";

@Module({
  imports: [PrismaModule, OsrmModule],
  controllers: [VansController],
  providers: [VansService],
  exports: [VansService],
})
export class VansModule {}
