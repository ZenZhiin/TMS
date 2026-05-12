import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key', // In prod, use env
    });
  }

  async validate(payload: any) {
    // Since we are a microservice, we just trust the token if it's valid
    // We can return the payload as the user object
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
