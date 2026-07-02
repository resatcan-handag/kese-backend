import { Body, Controller, Get, Put } from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { SetBudgetDto } from "./dto";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Put()
  set(@Body() dto: SetBudgetDto) {
    return this.service.set(dto);
  }
}
