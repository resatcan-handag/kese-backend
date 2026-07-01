import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CreateTransactionDto, UpdateTransactionDto } from "./dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  // TODO: auth eklenince oturum kullanicisi kullanilacak.
  private async currentUserId(): Promise<string> {
    const user = await this.prisma.user.findFirstOrThrow();
    return user.id;
  }

  async findAll(query: { categoryId?: string }) {
    const userId = await this.currentUserId();
    return this.prisma.transaction.findMany({
      where: { userId, categoryId: query.categoryId },
      include: { category: true },
      orderBy: { date: "desc" },
    });
  }

  async create(dto: CreateTransactionDto) {
    const userId = await this.currentUserId();
    let categoryId = dto.categoryId;

    // Kategori verilmemisse AI onersin.
    if (!categoryId && dto.description) {
      const cats = await this.prisma.category.findMany();
      const name = await this.ai.suggestCategory(
        dto.description,
        cats.map((c) => c.name),
      );
      categoryId = cats.find((c) => c.name === name)?.id;
    }

    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        source: dto.source ?? "MANUAL",
        userId,
        categoryId,
      },
    });
  }

  async update(id: string, dto: UpdateTransactionDto) {
    return this.prisma.transaction.update({
      where: { id },
      data: {
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        description: dto.description,
        categoryId: dto.categoryId,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.transaction.delete({ where: { id } });
    return { ok: true };
  }
}
