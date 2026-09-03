import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1');

  // M6-03: Security hardening — helmet + restricted CORS (was origin:true)
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const allowedOrigins = (
    process.env.CORS_ALLOWED_ORIGINS ??
    'http://localhost:3000,http://localhost:3002'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  // Swagger / OpenAPI docs
  const config = new DocumentBuilder()
    .setTitle('SOIS API')
    .setDescription(
      'Skilling Outcomes Intelligence System — PS ID 26135, Govt of Maharashtra',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`SOIS backend running on http://localhost:${port}`);
  logger.log(`API docs: http://localhost:${port}/docs`);
}
void bootstrap();
