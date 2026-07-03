import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get("summary")
  summary(@Query("month") month?: string) {
    return this.service.summary(month);
  }

  @Get("insights")
  insights(@Query("month") month?: string) {
    return this.service.insights(month);
  }

  @Get("trend")
  trend(@Query("month") month?: string) {
    return this.service.trend(month);
  }

  @Get("months")
  months() {
    return this.service.months();
  }
}
