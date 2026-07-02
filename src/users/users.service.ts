import { Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "../auth/current-user";

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUser,
  ) {}

  // Oturumdaki kullanicinin profili.
  async me() {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: this.currentUser.id },
    });
    return { id: u.id, email: u.email, createdAt: u.createdAt };
  }
}
