import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Polyfill to allow Express to serialize PostgreSQL BigInt columns
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();