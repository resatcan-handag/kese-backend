import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from "class-validator";

// Prisma'daki TxSource enum'u ile ayni degerler (uretimden sonra da uyumlu).
export type TxSource = "MANUAL" | "RECEIPT" | "CSV";

export class CreateTransactionDto {
  @IsNumber()
  amount!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(["MANUAL", "RECEIPT", "CSV"])
  source?: TxSource;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
