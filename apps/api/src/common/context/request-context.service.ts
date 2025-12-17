import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

export type RequestContextStore = {
  accountId?: string;
  account?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  organizationId?: string;
  organization?: {
    id: string;
    slug: string;
    name: string;
    subscriptionTier: string;
  };
  membership?: {
    id: string;
    role: string;
    tenantId: string;
    tenant?: {
      id: string;
      slug: string;
      name: string;
      subscriptionTier?: string | null;
    };
  };
  tenantSlug?: string;
};

@Injectable()
export class RequestContextService {
  private static asyncLocalStorage = new AsyncLocalStorage<RequestContextStore>();

  /**
   * Run a function within a request context
   */
  static run<T>(store: RequestContextStore, fn: () => T): T {
    return RequestContextService.asyncLocalStorage.run(store, fn);
  }

  /**
   * Get the current request context store
   */
  get store(): RequestContextStore | undefined {
    return RequestContextService.asyncLocalStorage.getStore();
  }

  /**
   * Get the current account ID
   */
  get accountId(): string | undefined {
    return this.store?.accountId;
  }

  /**
   * Get the current organization ID
   */
  get organizationId(): string | undefined {
    return this.store?.organizationId;
  }

  /**
   * Get the current tenant slug
   */
  get tenantSlug(): string | undefined {
    return this.store?.tenantSlug;
  }

  /**
   * Update the account in the current context
   */
  setAccount(account: NonNullable<RequestContextStore["account"]>) {
    const store = this.store;
    if (store) {
      store.accountId = account.id;
      store.account = account;
    }
  }

  /**
   * Update the organization in the current context
   */
  setOrganization(org: NonNullable<RequestContextStore["organization"]>) {
    const store = this.store;
    if (store) {
      store.organizationId = org.id;
      store.organization = org;
      store.tenantSlug = org.slug;
    }
  }

  /**
   * Update the membership in the current context
   */
  setMembership(membership: NonNullable<RequestContextStore["membership"]>) {
    const store = this.store;
    if (store) {
      store.membership = membership;
    }
  }

  /**
   * Require account to be present, throws if not
   */
  requireAccount(): NonNullable<RequestContextStore["account"]> {
    const account = this.store?.account;
    if (!account) {
      throw new Error("Request context missing account");
    }
    return account;
  }

  /**
   * Require organization to be present, throws if not
   */
  requireOrganization(): NonNullable<RequestContextStore["organization"]> {
    const org = this.store?.organization;
    if (!org) {
      throw new Error("Request context missing organization");
    }
    return org;
  }
}
