import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { ImportCsvDto } from "./dto";

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  // TODO: auth eklenince oturum kullanicisi kullanilacak.
  private async currentUserId(): Promise<string> {
    const user = await this.prisma.user.findFirstOrThrow();
    return user.id;
  }

  // Eslenmis CSV satirlarindan CSV kaynakli islemler olustur.
  async csv(dto: ImportCsvDto) {
    const userId = await this.currentUserId();
    const cats = await this.prisma.category.findMany();
    const names = cats.map((c) => c.name);

    const data = await Promise.all(
      dto.rows.map(async (row) => {
        let categoryId = row.categoryId;
        // Kategori verilmemisse aciklamadan AI onersin.
        if (!categoryId && row.description) {
          const name = await this.ai.suggestCategory(row.description, names);
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
