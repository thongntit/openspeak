import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  const rawOrigin = config.get<string>('CORS_ORIGIN');
  const origin = rawOrigin.includes(',')
    ? rawOrigin.split(',').map((o) => o.trim())
    : rawOrigin;
  app.enableCors({ origin, credentials: true });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
void bootstrap();
