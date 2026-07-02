import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AiModule } from "./ai/ai.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { CategoriesModule } from "./categories/categories.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ReceiptsModule } from "./receipts/receipts.module";
import { ImportModule } from "./import/import.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    DashboardModule,
    ReceiptsModule,
    ImportModule,
    BudgetsModule,
    UsersModule,
  ],
})
export class AppModule {}
