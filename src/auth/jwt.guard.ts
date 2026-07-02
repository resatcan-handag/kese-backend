import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { verifyToken } from "./security";

// Global guard: @Public disindaki tum uclar icin gecerli JWT ister,
// dogrulanan kullaniciyi req.user'a koyar (CurrentUser buradan okur).
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { userId: string };
    }>();

    const header = req.headers["authorization"] ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Token yok.");
    }

    const payload = verifyToken(token);
    if (!payload) throw new UnauthorizedException("Geçersiz token.");

    req.user = { userId: payload.sub };
    return true;
  }
}
