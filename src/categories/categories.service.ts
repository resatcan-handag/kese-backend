import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CreateCategoryDto } from "./dto";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { name: dto.name, color: dto.color, icon: dto.icon },
    });
  }

  async suggest(description: string) {
    const cats = await this.prisma.category.findMany();
    const suggested = await this.ai.suggestCategory(
      description,
      cats.map((c) => c.name),
    );
    return { suggested };
  }

  // Kategoriyi sil. Once bagli butceleri sil (zorunlu iliski);
  // islemler optional oldugu icin categoryId otomatik null'a duser (SetNull).
  async remove(id: string) {
    await this.prisma.budget.deleteMany({ where: { categoryId: id } });
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}
