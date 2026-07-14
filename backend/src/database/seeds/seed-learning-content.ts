import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dataSource from '../../data-source';
import { loadLearningContent } from '../content/learning-content.loader';
import { LearningContentBundle } from '../content/learning-content.types';
import {
  LearningContentSeedSummary,
  seedLearningContent,
} from './learning-content.seeder';

interface SeedLearningContentDatabaseDependencies {
  load: () => LearningContentBundle;
  dataSource: DataSource;
  seed: (
    dataSource: DataSource,
    bundle: LearningContentBundle,
  ) => Promise<LearningContentSeedSummary>;
}

export async function seedLearningContentDatabase({
  load,
  dataSource,
  seed,
}: SeedLearningContentDatabaseDependencies): Promise<LearningContentSeedSummary> {
  const bundle = load();
  dataSource.setOptions({ logging: false });
  await dataSource.initialize();

  try {
    return await seed(dataSource, bundle);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void seedLearningContentDatabase({
    load: loadLearningContent,
    dataSource,
    seed: seedLearningContent,
  })
    .then((summary) => {
      console.log('Learning content seed complete:', summary);
    })
    .catch(() => {
      console.error('Learning content seed failed.');
      process.exitCode = 1;
    });
}
