import { Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CurrentUser } from "../auth/current-user";
import { CreateTransactionDto, UpdateTransactionDto } from "./dto";

@Injectable({ scope: Scope.REQUEST })
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly currentUser: CurrentUser,
  ) {}

  private async currentUserId(): Promise<string> {
    return this.currentUser.id;
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
      const cats = await this.prisma.category.findMany({ where: { userId } });
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
    const userId = await this.currentUserId();
    // updateMany ile kullaniciya gore kapsa (baskasinin kaydini degistiremez).
    await this.prisma.transaction.updateMany({
      where: { id, userId },
      data: {
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        description: dto.description,
        categoryId: dto.categoryId,
      },
    });
    return this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
  }

  async remove(id: string) {
    const userId = await this.currentUserId();
    await this.prisma.transaction.deleteMany({ where: { id, userId } });
    return { ok: true };
  }
}
