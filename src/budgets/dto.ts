import { IsNumber, IsString, Min } from "class-validator";

// Bir kategoriye aktif ay icin limit ata (0 => limiti kaldir).
export class SetBudgetDto {
  @IsString()
  categoryId!: string;

  @IsNumber()
  @Min(0)
  limit!: number;
}
