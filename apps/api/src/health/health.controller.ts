import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/logto-auth.guard";

@Controller("health")
export class HealthController {
  @Get()
  @Public()
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "staysafeos-api",
      version: "2.0.0",
    };
  }
}
