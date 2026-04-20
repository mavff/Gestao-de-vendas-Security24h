import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set. Refusing to start with insecure default.');
    }
    super({
      // Aceita token no header OU na query (?token=...) — necessário para <img src> em /photos/:id.
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      secretOrKey: secret,
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}
