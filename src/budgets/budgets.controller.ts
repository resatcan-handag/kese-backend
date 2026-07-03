import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { SetBudgetDto } from "./dto";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get()
  list(@Query("month") month?: string) {
    return this.service.list(month);
  }

  @Put()
  set(@Body() dto: SetBudgetDto) {
    return this.service.set(dto);
  }
}
