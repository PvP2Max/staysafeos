import { Module } from "@nestjs/common";
import { OptimizationController } from "./optimization.controller";
import { OptimizationService } from "./optimization.service";
import { OptimizationListener } from "./optimization.listener";
import { OsrmModule } from "../osrm/osrm.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, OsrmModule],
  controllers: [OptimizationController],
  providers: [OptimizationService, OptimizationListener],
  exports: [OptimizationService],
})
export class OptimizationModule {}
