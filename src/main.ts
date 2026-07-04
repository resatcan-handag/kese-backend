import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

const DEV_JWT_SECRET = "kese-dev-secret-degistir";

async function bootstrap() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEV_JWT_SECRET) {
    new Logger("Bootstrap").warn(
      "JWT_SECRET tanimli degil ya da varsayilan dev degeri — uretimde .env'de guclu bir deger ayarla.",
    );
  }

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
