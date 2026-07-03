import { IsNumber, IsOptional, IsString, Min } from "class-validator";

// Bir kategoriye (secili ay icin) limit ata (0 => limiti kaldir).
export class SetBudgetDto {
  @IsString()
  categoryId!: string;

  @IsNumber()
  @Min(0)
  limit!: number;

  // "YYYY-MM"; verilmezse son islemin ayi.
  @IsOptional()
  @IsString()
  month?: string;
}
