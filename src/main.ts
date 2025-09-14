import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get environment variables
  const nodeEnv: string = configService.get('NODE_ENV', 'development');
  const port: number = configService.get('PORT', 3000);
  const apiPrefix: string = configService.get('API_PREFIX', 'api/v1');
  const corsOrigin: string = configService.get(
    'CORS_ORIGIN',
    'http://localhost:3000',
  );
  const swaggerEnabled: boolean =
    configService.get('SWAGGER_ENABLED', 'true') === 'true';
  const helmetEnabled: boolean =
    configService.get('HELMET_ENABLED', 'true') === 'true';
  const compressionEnabled: boolean =
    configService.get('COMPRESSION_ENABLED', 'true') === 'true';

  // Security middleware
  if (helmetEnabled) {
    app.use(helmet());
  }

  if (compressionEnabled) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    app.use(compression());
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const origins = corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.includes('*')) {
    throw new Error(
      'CORS_ORIGIN must not contain "*" when credentials are enabled',
    );
  }
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix(apiPrefix);

  if (swaggerEnabled && (nodeEnv === 'development' || nodeEnv === 'staging')) {
    const config = new DocumentBuilder()
      .setTitle('Zymptek API')
      .setDescription(
        `The Zymptek API documentation - ${nodeEnv.toUpperCase()}`,
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  console.log(`🌍 Environment: ${nodeEnv.toUpperCase()}`);

  if (swaggerEnabled && (nodeEnv === 'development' || nodeEnv === 'staging')) {
    const baseUrl = `http://localhost:${port}`;
    console.log(`📚 Swagger documentation: ${baseUrl}/${apiPrefix}/docs`);
  }
}
void bootstrap();
