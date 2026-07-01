import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AiModule } from "./ai/ai.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { CategoriesModule } from "./categories/categories.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ReceiptsModule } from "./receipts/receipts.module";
import { ImportModule } from "./import/import.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    TransactionsModule,
    CategoriesModule,
    DashboardModule,
    ReceiptsModule,
    ImportModule,
  ],
})
export class AppModule {}
