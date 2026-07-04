import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ChangePasswordDto, DeleteAccountDto } from "./dto";

@Controller("users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get("me")
  me() {
    return this.service.me();
  }

  @Post("refresh-token")
  refreshToken() {
    return this.service.refreshToken();
  }

  @Post("change-password")
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.service.changePassword(dto);
  }

  @Delete("me")
  deleteAccount(@Body() dto: DeleteAccountDto) {
    return this.service.deleteAccount(dto);
  }
}
