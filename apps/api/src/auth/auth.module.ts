import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LogtoAuthGuard } from "./logto-auth.guard";
import { LogtoJwtService } from "./logto-jwt.service";
import { LogtoManagementService } from "./logto-management.service";
import { RenderManagementService } from "./render-management.service";
import { RequestContextService } from "../common/context/request-context.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LogtoJwtService, LogtoAuthGuard, LogtoManagementService, RenderManagementService, RequestContextService],
  exports: [LogtoJwtService, LogtoAuthGuard, LogtoManagementService, RenderManagementService, RequestContextService],
})
export class AuthModule {}
