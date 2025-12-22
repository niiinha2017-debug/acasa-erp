import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    console.log('🟠 JWT GUARD');
    console.log('URL:', req.originalUrl || req.url);
    console.log('Authorization header:', req.headers['authorization']);

    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🟡 JWT GUARD handleRequest');
    console.log('err:', err);
    console.log('user:', user);
    console.log('info:', info);

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
