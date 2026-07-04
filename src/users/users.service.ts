import { BadRequestException, Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser } from "../auth/current-user";
import { hashPassword, signToken, verifyPassword } from "../auth/security";
import { ChangePasswordDto, DeleteAccountDto } from "./dto";

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUser,
  ) {}

  // Oturumu yenile: gecerli token'la gelen kullaniciya taze bir token ver
  // (kayan oturum). Guard token'i dogruladigi icin burada sadece imzalariz.
  refreshToken() {
    return { token: signToken(this.currentUser.id) };
  }

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

  // Hesabı sil: şifre onayı sonrası tüm veriyi (FK sırasına göre) + kullanıcıyı sil.
  async deleteAccount(dto: DeleteAccountDto) {
    const userId = this.currentUser.id;
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!verifyPassword(dto.password, u.passwordHash)) {
      throw new BadRequestException("Şifre hatalı.");
    }
    await this.prisma.transaction.deleteMany({ where: { userId } });
    await this.prisma.budget.deleteMany({ where: { userId } });
    await this.prisma.receipt.deleteMany({ where: { userId } });
    await this.prisma.insight.deleteMany({ where: { userId } });
    await this.prisma.category.deleteMany({ where: { userId } });
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}
