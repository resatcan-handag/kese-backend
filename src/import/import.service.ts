import { Injectable, Scope } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CurrentUser } from "../auth/current-user";
import { ImportCsvDto } from "./dto";

@Injectable({ scope: Scope.REQUEST })
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly currentUser: CurrentUser,
  ) {}

  private async currentUserId(): Promise<string> {
    return this.currentUser.id;
  }

  // Eslenmis CSV satirlarindan CSV kaynakli islemler olustur.
  async csv(dto: ImportCsvDto) {
    const userId = await this.currentUserId();
    const cats = await this.prisma.category.findMany({ where: { userId } });
    const names = cats.map((c) => c.name);

    const data = await Promise.all(
      dto.rows.map(async (row) => {
        let categoryId = row.categoryId;
        // Kategori verilmemisse aciklamadan AI onersin.
        if (!categoryId && row.description) {
          // Toplu ice aktarma: her satirda LLM cagirma, hizli kural-tabanli.
          const name = await this.ai.suggestCategory(row.description, names, false);
          categoryId = cats.find((c) => c.name === name)?.id;
        }
        return {
          amount: row.amount,
          date: new Date(row.date),
          description: row.description,
          source: "CSV" as const,
          userId,
          categoryId,
        };
      }),
    );

    const result = await this.prisma.transaction.createMany({ data });
    return { created: result.count };
  }
}
