import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";
import { Public } from "./public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: AuthDto) {
    return this.service.register(dto);
  }

  @Public()
  @Post("login")
  login(@Body() dto: AuthDto) {
    return this.service.login(dto);
  }
}
