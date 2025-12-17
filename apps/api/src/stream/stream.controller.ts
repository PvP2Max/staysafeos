import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { StreamService } from "./stream.service";
import { LogtoAuthGuard, Roles } from "../auth/logto-auth.guard";
import { RequestContextService } from "../common/context/request-context.service";

@Controller("stream")
@UseGuards(LogtoAuthGuard)
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * SSE stream for all events (role-filtered)
   */
  @Get()
  @Roles("RIDER", "SAFETY", "DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async stream(@Res() res: FastifyReply) {
    const org = this.requestContext.requireOrganization();
    const membership = this.requestContext.store?.membership;

    // Set SSE headers
    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Send initial connected event
    res.raw.write(
      `data: ${JSON.stringify({
        type: "connected",
        payload: { role: membership?.role },
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Determine which events this role can see
    const roleEventTypes = this.getRoleEventTypes(membership?.role ?? "RIDER");

    // Subscribe to event stream
    const subscription = this.streamService
      .getFilteredStream(org.id, roleEventTypes)
      .subscribe({
        next: (event) => {
          res.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        },
        error: (err) => {
          console.error("[stream] Error:", err);
          res.raw.end();
        },
      });

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      res.raw.write(
        `data: ${JSON.stringify({
          type: "heartbeat",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }, 30000);

    // Cleanup on disconnect
    res.raw.on("close", () => {
      clearInterval(heartbeat);
      subscription.unsubscribe();
    });
  }

  /**
   * SSE stream for dispatcher events only
   */
  @Get("dispatcher")
  @Roles("DISPATCHER", "EXECUTIVE", "ADMIN")
  async dispatcherStream(@Res() res: FastifyReply) {
    const org = this.requestContext.requireOrganization();

    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    res.raw.write(
      `data: ${JSON.stringify({
        type: "connected",
        payload: { stream: "dispatcher" },
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    const subscription = this.streamService
      .getFilteredStream(org.id, [
        "ride.created",
        "ride.updated",
        "ride.reviewed",
        "van.updated",
        "van.transfer.created",
        "van.transfer.updated",
      ])
      .subscribe({
        next: (event) => {
          res.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        },
      });

    const heartbeat = setInterval(() => {
      res.raw.write(
        `data: ${JSON.stringify({
          type: "heartbeat",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }, 30000);

    res.raw.on("close", () => {
      clearInterval(heartbeat);
      subscription.unsubscribe();
    });
  }

  /**
   * SSE stream for driver events only
   */
  @Get("driver")
  @Roles("DRIVER", "TC", "DISPATCHER", "EXECUTIVE", "ADMIN")
  async driverStream(@Res() res: FastifyReply) {
    const org = this.requestContext.requireOrganization();

    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    res.raw.write(
      `data: ${JSON.stringify({
        type: "connected",
        payload: { stream: "driver" },
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    const subscription = this.streamService
      .getFilteredStream(org.id, [
        "ride.updated",
        "van.updated",
        "van.transfer.created",
        "van.transfer.updated",
      ])
      .subscribe({
        next: (event) => {
          res.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        },
      });

    const heartbeat = setInterval(() => {
      res.raw.write(
        `data: ${JSON.stringify({
          type: "heartbeat",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    }, 30000);

    res.raw.on("close", () => {
      clearInterval(heartbeat);
      subscription.unsubscribe();
    });
  }

  /**
   * Get event types allowed for a role
   */
  private getRoleEventTypes(role: string): string[] {
    const roleEvents: Record<string, string[]> = {
      RIDER: [],
      SAFETY: ["ride.created", "ride.updated"],
      DRIVER: ["ride.updated", "van.updated", "van.transfer.created", "van.transfer.updated"],
      TC: ["ride.created", "ride.updated", "van.updated", "van.transfer.created", "van.transfer.updated"],
      DISPATCHER: ["ride.created", "ride.updated", "ride.reviewed", "van.updated", "van.transfer.created", "van.transfer.updated"],
      EXECUTIVE: ["ride.created", "ride.updated", "ride.reviewed", "van.updated", "van.transfer.created", "van.transfer.updated"],
      ADMIN: ["ride.created", "ride.updated", "ride.reviewed", "van.updated", "van.transfer.created", "van.transfer.updated"],
    };

    return roleEvents[role] ?? [];
  }
}
