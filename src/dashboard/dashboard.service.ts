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
}
