import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SecurityExceptionFilter } from './common/security-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // SECURITY: Set security headers (XSS, Clickjacking, etc.)
  app.use(helmet());

  // SECURITY: Global Exception Filter for Sanitization
  app.useGlobalFilters(new SecurityExceptionFilter());

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
