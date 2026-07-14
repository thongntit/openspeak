import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { loadLearningContent } from './content/learning-content.loader';
import { LearningContentBundle } from './content/learning-content.types';
import {
  LearningContentSeedSummary,
  seedLearningContent,
} from './seeds/learning-content.seeder';

interface PrepareLearningDatabaseDependencies {
  load: () => LearningContentBundle;
  dataSource: DataSource;
  seed: (
    dataSource: DataSource,
    bundle: LearningContentBundle,
  ) => Promise<LearningContentSeedSummary>;
}

export async function prepareLearningDatabase({
  load,
  dataSource,
  seed,
}: PrepareLearningDatabaseDependencies): Promise<LearningContentSeedSummary> {
  const bundle = load();
  dataSource.setOptions({ logging: false });
  await dataSource.initialize();

  try {
    await dataSource.runMigrations();
    return await seed(dataSource, bundle);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void prepareLearningDatabase({
    load: loadLearningContent,
    dataSource,
    seed: seedLearningContent,
  })
    .then((summary) => {
      console.log('Database migrations complete.');
      console.log('Learning content seed complete:', summary);
    })
    .catch(() => {
      console.error('Learning database preparation failed.');
      process.exitCode = 1;
    });
}
