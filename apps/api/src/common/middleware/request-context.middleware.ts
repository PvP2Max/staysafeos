import { Injectable, NestMiddleware } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  RequestContextService,
  RequestContextStore,
} from "../context/request-context.service";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: FastifyRequest["raw"], res: FastifyReply["raw"], next: () => void) {
    // Extract tenant slug from headers
    const tenantSlug =
      (req.headers["x-tenant-slug"] as string) ||
      (req.headers["x-staysafe-tenant"] as string) ||
      (req.headers["x-ssos-tenant-slug"] as string) ||
      undefined;

    // Initialize an empty context store
    const store: RequestContextStore = {
      tenantSlug,
    };

    // Run the rest of the request within this context
    RequestContextService.run(store, () => {
      next();
    });
  }
}
