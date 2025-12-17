import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LogtoAuthGuard } from "./logto-auth.guard";
import { LogtoJwtService } from "./logto-jwt.service";
import { RequestContextService } from "../common/context/request-context.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LogtoJwtService, LogtoAuthGuard, RequestContextService],
  exports: [LogtoJwtService, LogtoAuthGuard, RequestContextService],
})
export class AuthModule {}
