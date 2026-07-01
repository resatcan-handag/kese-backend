import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  private async currentUserId(): Promise<string> {
    const user = await this.prisma.user.findFirstOrThrow();
    return user.id;
  }

  async summary() {
    const userId = await this.currentUserId();

    const totalAgg = await this.prisma.transaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const grouped = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId },
      _sum: { amount: true },
    });

    const cats = await this.prisma.category.findMany();
    const categories = grouped
      .map((g) => {
        const cat = cats.find((c) => c.id === g.categoryId);
        return {
          category: cat?.name ?? "Diger",
          color: cat?.color ?? "#888888",
          amount: g._sum.amount ? g._sum.amount.toNumber() : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      total: totalAgg._sum.amount ? totalAgg._sum.amount.toNumber() : 0,
      categories,
    };
  }

  async insights() {
    const { total, categories } = await this.summary();
    const text = await this.ai.generateInsight({
      total,
      topCategory: categories[0]?.category,
    });
    return { text };
  }

  // Gunluk harcama serisi. Verinin bulundugu son islemin ayini pencere alir
  // (seed Haziran'da, "bu ay" bos kalmasin diye), her gun icin toplami doner.
  async trend() {
    const userId = await this.currentUserId();

    const latest = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    });
    const ref = latest?.date ?? new Date();

    const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();

    const txns = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      select: { date: true, amount: true },
    });

    const sums = new Array<number>(daysInMonth).fill(0);
    for (const t of txns) {
      const day = new Date(t.date).getDate();
      sums[day - 1] += t.amount.toNumber();
    }

    const label = monthStart.toLocaleDateString("tr-TR", {
      month: "long",
      year: "numeric",
    });

    return {
      label,
      points: sums.map((amount, i) => ({ day: i + 1, amount })),
    };
  }
}
