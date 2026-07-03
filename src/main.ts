import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Fis fotografi data URL (base64) olarak JSON govdesinde geliyor;
  // Express'in varsayilan 100kb JSON limiti asilir, o yuzden yukseltiyoruz.
  app.useBodyParser("json", { limit: "15mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "15mb" });
  app.enableCors({ origin: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix("api");
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Kese API: http://localhost:${port}/api`);
}

bootstrap();
