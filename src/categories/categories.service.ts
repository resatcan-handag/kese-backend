import { Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CurrentUser } from "../auth/current-user";
import { CreateCategoryDto } from "./dto";

@Injectable({ scope: Scope.REQUEST })
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly currentUser: CurrentUser,
  ) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { userId: this.currentUser.id },
      orderBy: { name: "asc" },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        userId: this.currentUser.id,
      },
    });
  }

  async suggest(description: string) {
    const cats = await this.prisma.category.findMany({
      where: { userId: this.currentUser.id },
    });
    const suggested = await this.ai.suggestCategory(
      description,
      cats.map((c) => c.name),
    );
    return { suggested };
  }

  // Kategoriyi sil (yalnizca kullanicinin kendi kategorisi). Once bagli butceler,
  // sonra kategori; islemler optional iliski oldugu icin categoryId null'a duser.
  async remove(id: string) {
    const userId = this.currentUser.id;
    await this.prisma.budget.deleteMany({ where: { categoryId: id, userId } });
    await this.prisma.category.deleteMany({ where: { id, userId } });
    return { ok: true };
  }
}
