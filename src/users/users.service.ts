import { BadRequestException, Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "../auth/current-user";
import { hashPassword, verifyPassword } from "../auth/security";
import { ChangePasswordDto } from "./dto";

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

  // Sifre degistir: once mevcut sifreyi dogrula, sonra yeni hash'i yaz.
  async changePassword(dto: ChangePasswordDto) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: this.currentUser.id },
    });
    if (!verifyPassword(dto.currentPassword, u.passwordHash)) {
      throw new BadRequestException("Mevcut şifre hatalı.");
    }
    if (verifyPassword(dto.newPassword, u.passwordHash)) {
      throw new BadRequestException("Yeni şifre eskisiyle aynı olamaz.");
    }
    await this.prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hashPassword(dto.newPassword) },
    });
    return { ok: true };
  }
}
