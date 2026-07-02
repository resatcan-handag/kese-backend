import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { CurrentUser } from "./current-user";

// @Global: CurrentUser her serviste (modul import etmeden) enjekte edilebilir.
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    CurrentUser,
    // Tum uygulama icin JWT guard (auth uclari @Public).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [CurrentUser],
})
export class AuthModule {}
