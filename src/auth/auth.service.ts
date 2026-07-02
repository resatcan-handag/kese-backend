import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import { hashPassword, signToken, verifyPassword } from "./security";
import { DEFAULT_CATEGORIES } from "./default-categories";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private token(user: { id: string; email: string; createdAt: Date }) {
    return {
      token: signToken(user.id),
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    };
  }

  async register(dto: AuthDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Bu e-posta zaten kayıtlı.");

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(dto.password),
        // Yeni kullaniciya varsayilan kategoriler.
        categories: { create: DEFAULT_CATEGORIES },
      },
    });

    return this.token(user);
  }

  async login(dto: AuthDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("E-posta veya şifre hatalı.");
    }
    return this.token(user);
  }
}
