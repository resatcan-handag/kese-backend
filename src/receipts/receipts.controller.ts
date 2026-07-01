import { Body, Controller, Param, Post } from "@nestjs/common";
import { ReceiptsService } from "./receipts.service";
import { ConfirmReceiptDto, UploadReceiptDto } from "./dto";

@Controller("receipts")
export class ReceiptsController {
  constructor(private readonly service: ReceiptsService) {}

  @Post()
  upload(@Body() dto: UploadReceiptDto) {
    return this.service.upload(dto);
  }

  @Post(":id/confirm")
  confirm(@Param("id") id: string, @Body() dto: ConfirmReceiptDto) {
    return this.service.confirm(id, dto);
  }
}
