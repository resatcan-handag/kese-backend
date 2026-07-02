import { Inject, Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";

// Request-scoped: guard'in request'e koydugu oturum kullanicisini tasir.
// Servisler bunu enjekte edip currentUserId() yerine kullanir.
@Injectable({ scope: Scope.REQUEST })
export class CurrentUser {
  constructor(
    @Inject(REQUEST) private readonly req: { user?: { userId: string } },
  ) {}

  get id(): string {
    const id = this.req.user?.userId;
    if (!id) throw new UnauthorizedException("Oturum yok.");
    return id;
  }
}
