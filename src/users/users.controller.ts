import { Body, Controller, Get, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ChangePasswordDto } from "./dto";

@Controller("users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get("me")
  me() {
    return this.service.me();
  }

  @Post("change-password")
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.service.changePassword(dto);
  }
}
