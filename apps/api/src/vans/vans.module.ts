import { Module } from "@nestjs/common";
import { VansController } from "./vans.controller";
import { VansService } from "./vans.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [VansController],
  providers: [VansService],
  exports: [VansService],
})
export class VansModule {}
