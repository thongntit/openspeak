import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from './auth/auth.module';
import { LearningDataModule } from './learning/learning-data.module';
import { UsersModule } from './users/users.module';

describe('AppModule production foundation', () => {
  it('loads authentication, users, and learning data modules', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    const { AppModule } =
      jest.requireActual<typeof import('./app.module')>('./app.module');
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as
      | unknown[]
      | undefined;

    expect(imports).toEqual(
      expect.arrayContaining([AuthModule, UsersModule, LearningDataModule]),
    );
  });
});
