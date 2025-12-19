import { Module } from "@nestjs/common";
import { GlobalStatsController } from "./global-stats.controller";
import { GlobalStatsService } from "./global-stats.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [GlobalStatsController],
  providers: [GlobalStatsService],
  exports: [GlobalStatsService],
})
export class GlobalStatsModule {}
