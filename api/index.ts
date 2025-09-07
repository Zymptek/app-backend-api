import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from '../src/app.module';

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    
    // Security middleware
    app.use(helmet() as any);
    app.use(compression());

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
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // API prefix
    const apiPrefix = process.env.API_PREFIX || 'api/v1';
    app.setGlobalPrefix(apiPrefix);

    // Swagger documentation
    const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
    if (swaggerEnabled) {
      const config = new DocumentBuilder()
        .setTitle('Zymptek API')
        .setDescription('The Zymptek API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    }

    await app.init();
  }
  return app;
}

export default async (req: any, res: any) => {
  const nestApp = await createApp();
  return nestApp.getHttpAdapter().getInstance()(req, res);
};
