export interface FormStateEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * A namespaced TTL-based in-memory form state service.
 * - Namespace allows multiple independent forms (e.g., 'poker.room.create').
 * - Each userId stores a single state object per namespace.
 */
export class FormStateService {
  private readonly namespaceToUserState: Map<string, Map<string, FormStateEntry<unknown>>> = new Map();
  private readonly defaultTtlMs: number;
  private cleanupIntervalHandle?: NodeJS.Timeout;

  constructor(options?: { defaultTtlMs?: number; enableAutoCleanup?: boolean; cleanupIntervalMs?: number }) {
    this.defaultTtlMs = options?.defaultTtlMs ?? 15 * 60 * 1000; // 15 minutes
    if (options?.enableAutoCleanup ?? true) {
      const intervalMs = options?.cleanupIntervalMs ?? 5 * 60 * 1000; // 5 minutes
      this.cleanupIntervalHandle = setInterval(() => this.cleanupExpired(), intervalMs);
    }
  }

  get<T>(namespace: string, userId: string): T | undefined {
    const userMap = this.namespaceToUserState.get(namespace);
    if (!userMap) return undefined;
    const entry = userMap.get(userId);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      userMap.delete(userId);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(namespace: string, userId: string, state: T, ttlMs?: number): void {
    const userMap = this.ensureNamespace(namespace);
    userMap.set(userId, {
      value: state,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(namespace: string, userId: string): void {
    const userMap = this.namespaceToUserState.get(namespace);
    if (!userMap) return;
    userMap.delete(userId);
  }

  has(namespace: string, userId: string): boolean {
    return this.get(namespace, userId) !== undefined;
  }

  clearNamespace(namespace: string): void {
    this.namespaceToUserState.delete(namespace);
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [namespace, userMap] of this.namespaceToUserState.entries()) {
      for (const [userId, entry] of userMap.entries()) {
        if (now > entry.expiresAt) {
          userMap.delete(userId);
        }
      }
      if (userMap.size === 0) {
        this.namespaceToUserState.delete(namespace);
      }
    }
  }

  stop(): void {
    if (this.cleanupIntervalHandle) {
      clearInterval(this.cleanupIntervalHandle);
      this.cleanupIntervalHandle = undefined;
    }
  }

  private ensureNamespace(namespace: string): Map<string, FormStateEntry<unknown>> {
    let userMap = this.namespaceToUserState.get(namespace);
    if (!userMap) {
      userMap = new Map<string, FormStateEntry<unknown>>();
      this.namespaceToUserState.set(namespace, userMap);
    }
    return userMap;
  }
}

export default FormStateService;

