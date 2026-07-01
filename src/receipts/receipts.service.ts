import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { ConfirmReceiptDto, UploadReceiptDto } from "./dto";

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  // TODO: auth eklenince oturum kullanicisi kullanilacak.
  private async currentUserId(): Promise<string> {
    const user = await this.prisma.user.findFirstOrThrow();
    return user.id;
  }

  // Fis yukle -> kaydet -> AI ile alanlari cikar -> kategori oner.
  async upload(dto: UploadReceiptDto) {
    const userId = await this.currentUserId();

    const receipt = await this.prisma.receipt.create({
      data: { imageUrl: dto.image, status: "pending", userId },
    });

    const extracted = await this.ai.extractReceipt(receipt.imageUrl);

    // Satici adindan kategori oner.
    const cats = await this.prisma.category.findMany();
    const suggestedName = await this.ai.suggestCategory(
      extracted.merchant,
      cats.map((c) => c.name),
    );
    const suggestedCategory = cats.find((c) => c.name === suggestedName) ?? null;

    await this.prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        extractedJson: {
          ...extracted,
          suggestedCategoryId: suggestedCategory?.id ?? null,
        },
      },
    });

    return {
      id: receipt.id,
      status: receipt.status,
      extracted,
      suggestedCategory: suggestedCategory
        ? {
            id: suggestedCategory.id,
            name: suggestedCategory.name,
            color: suggestedCategory.color,
          }
        : null,
    };
  }

  // Okunan alanlar onaylaninca RECEIPT kaynakli islem olustur.
  async confirm(id: string, dto: ConfirmReceiptDto) {
    const userId = await this.currentUserId();

    const receipt = await this.prisma.receipt.findUnique({ where: { id } });
    if (!receipt || receipt.userId !== userId) {
      throw new NotFoundException("Fis bulunamadi.");
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        source: "RECEIPT",
        userId,
        categoryId: dto.categoryId,
        receiptId: receipt.id,
      },
      include: { category: true },
    });

    await this.prisma.receipt.update({
      where: { id: receipt.id },
      data: { status: "confirmed" },
    });

    return transaction;
  }
}
