import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class WaitingRoomGuard implements CanActivate {
  private readonly MAX_ACTIVE_USERS = 50; // Threshold for the "Waiting Room"
  private readonly SESSION_TTL = 30; // 30 seconds active session

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userIp = request.ip;
    const cacheKey = `active_session:${userIp}`;

    // 1. Check if user already has an active session
    const existingSession = await this.cacheManager.get(cacheKey);
    if (existingSession) {
      return true;
    }

    // 2. Count current active sessions
    // Note: In a real production apps, we'd use Redis 'SCAN' or a Sorted Set for accurate counting.
    // For this demo, we'll use a simple counter.
    const activeCount: number = (await this.cacheManager.get('active_users_count')) || 0;

    if (activeCount >= this.MAX_ACTIVE_USERS) {
      throw new ServiceUnavailableException({
        message: 'The server is currently busy. You have been placed in the waiting room.',
        retryAfter: 10,
        queuePosition: activeCount - this.MAX_ACTIVE_USERS + 1,
      });
    }

    // 3. Register new session
    await this.cacheManager.set(cacheKey, 'active', this.SESSION_TTL * 1000);
    await this.cacheManager.set('active_users_count', activeCount + 1, (this.SESSION_TTL + 5) * 1000);

    return true;
  }
}
