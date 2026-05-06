import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  const apiPrefix = configService.get<string>('apiPrefix') ?? 'api/v1';
  const frontendUrl = configService.get<string>('frontendUrl') ?? 'http://localhost:4200';
  const nodeEnv = configService.get<string>('nodeEnv') ?? 'development';

  // Security
  app.use(helmet());

  // CORS — only allow frontend origin in production
  app.enableCors({
    origin: nodeEnv === 'production' ? frontendUrl : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip properties not in DTO
      forbidNonWhitelisted: true,
      transform: true,          // Auto-transform primitives
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger — disabled only when SWAGGER_DISABLED=true
  const swaggerDisabled = process.env.SWAGGER_DISABLED === 'true';
  if (!swaggerDisabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Datatrack Transport API')
      .setDescription(
        'Multitenancy transport management system with real-time GPS tracking via Datatrack API',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Tenants')
      .addTag('Routes')
      .addTag('Passengers')
      .addTag('Clients')
      .addTag('Datatrack GPS')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port);
  console.log(`\n🚀 Datatrack Transport API running on http://localhost:${port}/${apiPrefix}`);
  if (!swaggerDisabled) {
    console.log(`📚 Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
