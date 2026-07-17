import { Module } from '@nestjs/common';
import { LearningDataModule } from '../learning/learning-data.module';
import { LearningContentController } from './learning-content.controller';
import { LearningContentService } from './learning-content.service';

@Module({
  imports: [LearningDataModule],
  controllers: [LearningContentController],
  providers: [LearningContentService],
})
export class LearningContentModule {}
