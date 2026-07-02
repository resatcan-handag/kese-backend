import { SetMetadata } from "@nestjs/common";

// Bu isaretli uclar JWT guard'i atlar (kayit/giris).
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
