import { Module } from "@nestjs/common";
import { SupportCodesController } from "./support-codes.controller";
import { SupportCodesService } from "./support-codes.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SupportCodesController],
  providers: [SupportCodesService],
  exports: [SupportCodesService],
})
export class SupportCodesModule {}
