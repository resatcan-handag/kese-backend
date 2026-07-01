import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";

// Fis fotografi JSON govdesinde data URL (base64) olarak gelir.
// (Multer/dosya yukleme yerine mevcut JSON api katmaniyla uyumlu tutuldu.)
export class UploadReceiptDto {
  @IsString()
  image!: string;

  @IsOptional()
  @IsString()
  filename?: string;
}

// Kullanici AI'nin okudugu alanlari onayladiginda islem olusturur.
export class ConfirmReceiptDto {
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
}
