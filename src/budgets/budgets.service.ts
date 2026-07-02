import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SetBudgetDto } from "./dto";

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: auth eklenince oturum kullanicisi kullanilacak.
  private async currentUserId(): Promise<string> {
    const user = await this.prisma.user.findFirstOrThrow();
    return user.id;
  }

  // Harcamanin bulundugu son islemin ayi (dashboard/trend ile ayni pencere).
  private async activeMonth(userId: string) {
    const latest = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });
    const ref = latest?.date ?? new Date();
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    const period = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    const label = start.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    return { start, end, period, label };
  }

  // Aktif ay icin her kategorinin limiti + harcamasi.
  async list() {
    const userId = await this.currentUserId();
    const { start, end, period, label } = await this.activeMonth(userId);

    const cats = await this.prisma.category.findMany({ orderBy: { name: "asc" } });
    const budgets = await this.prisma.budget.findMany({ where: { userId, period } });
    const grouped = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    const spentByCat = new Map<string, number>();
    for (const g of grouped) {
      if (g.categoryId) spentByCat.set(g.categoryId, g._sum.amount?.toNumber() ?? 0);
    }

    const items = cats
      .map((c) => {
        const b = budgets.find((x) => x.categoryId === c.id);
        return {
          categoryId: c.id,
          category: c.name,
          color: c.color,
          budgetId: b?.id ?? null,
          limit: b ? b.limit.toNumber() : null,
          spent: spentByCat.get(c.id) ?? 0,
        };
      })
      .sort((a, b) => b.spent - a.spent);

    const totalLimit = items.reduce((s, i) => s + (i.limit ?? 0), 0);
    const totalSpent = items.reduce((s, i) => s + i.spent, 0);

    return { period, label, totalLimit, totalSpent, items };
  }

  // Kategori limitini ata/guncelle; 0 ise kaldir.
  async set(dto: SetBudgetDto) {
    const userId = await this.currentUserId();
    const { period } = await this.activeMonth(userId);

    const existing = await this.prisma.budget.findFirst({
      where: { userId, categoryId: dto.categoryId, period },
    });

    if (dto.limit <= 0) {
      if (existing) await this.prisma.budget.delete({ where: { id: existing.id } });
      return { ok: true };
    }

    if (existing) {
      await this.prisma.budget.update({
        where: { id: existing.id },
        data: { limit: dto.limit },
      });
    } else {
      await this.prisma.budget.create({
        data: { period, limit: dto.limit, userId, categoryId: dto.categoryId },
      });
    }
    return { ok: true };
  }
}
