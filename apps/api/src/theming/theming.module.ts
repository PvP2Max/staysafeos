import { Module } from "@nestjs/common";
import { ThemingService } from "./theming.service";
import { ThemingController } from "./theming.controller";

@Module({
  controllers: [ThemingController],
  providers: [ThemingService],
  exports: [ThemingService],
})
export class ThemingModule {}
