import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Only apply to POST requests (mutations)
    if (request.method !== 'POST') {
      return next.handle();
    }

    const idempotencyKey = request.headers['x-idempotency-key'];
    if (!idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    // 1. Check if we have a cached response for this key
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      if (cachedResponse === 'PROCESSING') {
        throw new ConflictException('Request with this idempotency key is still being processed.');
      }
      return of(cachedResponse);
    }

    // 2. Lock the key while processing
    await this.cacheManager.set(cacheKey, 'PROCESSING', 60000); // 1 minute lock

    return next.handle().pipe(
      tap(async (response) => {
        // 3. Cache the successful result for 24 hours
        await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000);
      }),
    );
  }
}
