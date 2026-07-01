import { Body, Controller, Post } from "@nestjs/common";
import { ImportService } from "./import.service";
import { ImportCsvDto } from "./dto";

@Controller("import")
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @Post("csv")
  csv(@Body() dto: ImportCsvDto) {
    return this.service.csv(dto);
  }
}
