import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true,
    })
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? [
      "https://staysafeos.com",
      "https://home.staysafeos.com",
      "https://app.staysafeos.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Tenant-Slug",
      "X-StaySafe-Tenant",
      "x-ssos-tenant-slug",
    ],
  });

  // Global prefix for API routes
  app.setGlobalPrefix("v1");

  const port = process.env.PORT ?? 3001;
  await app.listen(port, "0.0.0.0");

  console.log(`StaySafeOS API v2 running on port ${port}`);
}

bootstrap();
