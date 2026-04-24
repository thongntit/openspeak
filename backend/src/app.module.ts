import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { WordsModule } from './words/words.module';
import { CollectionsModule } from './collections/collections.module';
import { ClerkMiddleware } from './common/middleware/clerk.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        CORS_ORIGIN: Joi.string().required(),
        CLERK_SECRET_KEY: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    WordsModule,
    CollectionsModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply ClerkMiddleware to protected routes here as they are added.
    // Example (uncomment when pronunciation endpoint exists):
    // consumer
    //   .apply(ClerkMiddleware)
    //   .forRoutes({ path: 'pronunciation/assess', method: RequestMethod.POST });
  }
}
