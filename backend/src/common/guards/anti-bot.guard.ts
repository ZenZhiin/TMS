import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AntiBotGuard implements CanActivate {
  private readonly MAX_TICKETS_PER_IP = 6; // Strict limit to prevent scalping
  private readonly VELOCITY_WINDOW = 3600; // 1 hour window

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const ip = request.ip;

    // 1. HoneyPot Check
    if (body.botToken) {
      // Intentionally slow down the response to waste bot resources
      await new Promise((resolve) => setTimeout(resolve, 2000));
      throw new ForbiddenException('Automated requests are not allowed.');
    }

    // 2. Scalping Protection: Limit total tickets per IP for an event
    if (body.ticketId) {
      const cacheKey = `scalper_check:${ip}:${body.ticketId}`;
      const currentCount: number = (await this.cacheManager.get(cacheKey)) || 0;
      const requestedQuantity = body.quantity || 0;

      if (currentCount + requestedQuantity > this.MAX_TICKETS_PER_IP) {
        throw new ForbiddenException(
          `Ticket limit exceeded for this IP. Max ${this.MAX_TICKETS_PER_IP} tickets allowed per event.`,
        );
      }

      // We don't increment here yet, because the order might fail.
      // We'll increment in the service upon successful creation.
    }

    return true;
  }
}
