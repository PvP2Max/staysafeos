import { Module } from "@nestjs/common";
import { DriversController } from "./drivers.controller";
import { DriversService } from "./drivers.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RidesModule } from "../rides/rides.module";

@Module({
  imports: [PrismaModule, RidesModule],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
