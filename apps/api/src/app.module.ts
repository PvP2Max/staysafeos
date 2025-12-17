import { Module, MiddlewareConsumer, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AccountsModule } from "./accounts/accounts.module";
import { TenantsModule } from "./tenants/tenants.module";
import { PagesModule } from "./pages/pages.module";
import { ThemingModule } from "./theming/theming.module";
import { HealthModule } from "./health/health.module";
import { RidesModule } from "./rides/rides.module";
import { VansModule } from "./vans/vans.module";
import { DriversModule } from "./drivers/drivers.module";
import { TrainingModule } from "./training/training.module";
import { ShiftsModule } from "./shifts/shifts.module";
import { StreamModule } from "./stream/stream.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { SupportCodesModule } from "./support-codes/support-codes.module";
import { RequestContextMiddleware } from "./common/middleware/request-context.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    AccountsModule,
    TenantsModule,
    PagesModule,
    ThemingModule,
    HealthModule,
    RidesModule,
    VansModule,
    DriversModule,
    TrainingModule,
    ShiftsModule,
    StreamModule,
    AnalyticsModule,
    SupportCodesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes({ path: "{*path}", method: RequestMethod.ALL });
  }
}
