import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: auth eklenince oturum kullanicisi kullanilacak; simdilik demo kullanici.
  async me() {
    const u = await this.prisma.user.findFirstOrThrow();
    return { id: u.id, email: u.email, createdAt: u.createdAt };
  }
}
