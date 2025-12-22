import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context) {
    const req = context.switchToHttp().getRequest();

    console.log('🟠 JWT GUARD');
    console.log('URL:', req.originalUrl);
    console.log('Authorization header:', req.headers.authorization);

    return super.canActivate(context);
  }
}

