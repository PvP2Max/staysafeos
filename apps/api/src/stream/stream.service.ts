import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Subject, Observable } from "rxjs";
import { filter } from "rxjs/operators";

export interface StreamEvent {
  type: string;
  payload: unknown;
  timestamp: string;
  orgId: string;
}

@Injectable()
export class StreamService implements OnModuleInit, OnModuleDestroy {
  private events$ = new Subject<StreamEvent>();
  private eventSubscriptions: (() => void)[] = [];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    // Subscribe to all relevant events
    const events = [
      "ride.created",
      "ride.updated",
      "ride.reviewed",
      "van.updated",
      "van.transfer.created",
      "van.transfer.updated",
    ];

    for (const event of events) {
      const unsubscribe = this.eventEmitter.on(event, (data: any) => {
        this.events$.next({
          type: event,
          payload: data.ride ?? data.van ?? data.transfer ?? data,
          timestamp: new Date().toISOString(),
          orgId: data.orgId,
        });
      });

      // Store cleanup function
      this.eventSubscriptions.push(() => {
        this.eventEmitter.removeListener(event, unsubscribe as any);
      });
    }
  }

  onModuleDestroy() {
    // Clean up subscriptions
    for (const unsubscribe of this.eventSubscriptions) {
      unsubscribe();
    }
    this.events$.complete();
  }

  /**
   * Get event stream filtered by organization
   */
  getOrgStream(orgId: string): Observable<StreamEvent> {
    return this.events$.pipe(filter((event) => event.orgId === orgId));
  }

  /**
   * Get event stream filtered by organization and event types
   */
  getFilteredStream(
    orgId: string,
    eventTypes: string[]
  ): Observable<StreamEvent> {
    return this.events$.pipe(
      filter(
        (event) =>
          event.orgId === orgId &&
          (eventTypes.length === 0 || eventTypes.includes(event.type))
      )
    );
  }

  /**
   * Emit a custom event (for testing or manual triggers)
   */
  emit(event: StreamEvent) {
    this.events$.next(event);
  }
}
