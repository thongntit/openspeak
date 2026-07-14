import { DataSource } from 'typeorm';
import { LearningContentBundle } from './content/learning-content.types';
import { LearningContentSeedSummary } from './seeds/learning-content.seeder';
import {
  createLearningContentCommandDataSource,
  prepareLearningDatabase,
} from './prepare-learning-database';
import { seedLearningContentDatabase } from './seeds/seed-learning-content';

jest.mock('../data-source', () => ({
  __esModule: true,
  default: {},
}));

const bundle = {
  schemaVersion: 1,
  namespace: 'starter',
  contentVersion: '2026.07.1',
  databaseContentVersion: 'starter@2026.07.1',
  decks: [],
} satisfies LearningContentBundle;

const summary = {
  contentVersion: 'starter@2026.07.1',
  decksUpserted: 0,
  cardsUpserted: 0,
  decksUnpublished: 0,
  cardsDeactivated: 0,
} satisfies LearningContentSeedSummary;

function createHarness() {
  const callOrder: string[] = [];
  const load = jest.fn(() => {
    callOrder.push('load-content');
    return bundle;
  });
  const dataSource = {} as DataSource;
  const initialize = jest.fn(() => {
    callOrder.push('initialize');
    return Promise.resolve(dataSource);
  });
  const runMigrations = jest.fn(() => {
    callOrder.push('run-migrations');
    return Promise.resolve([]);
  });
  const destroy = jest.fn(() => {
    callOrder.push('destroy');
    return Promise.resolve();
  });
  Object.assign(dataSource, {
    initialize,
    runMigrations,
    destroy,
  });
  const seed = jest.fn(() => {
    callOrder.push('seed-content');
    return Promise.resolve(summary);
  });

  return {
    callOrder,
    load,
    dataSource,
    initialize,
    runMigrations,
    destroy,
    seed,
  };
}

describe('prepareLearningDatabase', () => {
  it('validates, connects, migrates, seeds, and closes in order', async () => {
    const harness = createHarness();

    await expect(prepareLearningDatabase(harness)).resolves.toEqual(summary);

    expect(harness.callOrder).toEqual([
      'load-content',
      'initialize',
      'run-migrations',
      'seed-content',
      'destroy',
    ]);
    expect(harness.seed).toHaveBeenCalledWith(harness.dataSource, bundle);
  });

  it('does not connect when content is invalid', async () => {
    const harness = createHarness();
    harness.load.mockImplementation(() => {
      throw new Error('invalid content');
    });

    await expect(prepareLearningDatabase(harness)).rejects.toThrow(
      'invalid content',
    );

    expect(harness.initialize).not.toHaveBeenCalled();
    expect(harness.destroy).not.toHaveBeenCalled();
  });

  it('destroys the initialized DataSource when migrations fail', async () => {
    const harness = createHarness();
    const migrationError = new Error('migration failed');
    harness.runMigrations.mockImplementation(() => {
      harness.callOrder.push('run-migrations');
      return Promise.reject(migrationError);
    });

    await expect(prepareLearningDatabase(harness)).rejects.toBe(migrationError);

    expect(harness.destroy).toHaveBeenCalledTimes(1);
    expect(harness.seed).not.toHaveBeenCalled();
    expect(harness.callOrder).toEqual([
      'load-content',
      'initialize',
      'run-migrations',
      'destroy',
    ]);
  });

  it('destroys the initialized DataSource when seeding fails', async () => {
    const harness = createHarness();
    const seedError = new Error('seed failed');
    harness.seed.mockImplementation(() => {
      harness.callOrder.push('seed-content');
      return Promise.reject(seedError);
    });

    await expect(prepareLearningDatabase(harness)).rejects.toBe(seedError);

    expect(harness.destroy).toHaveBeenCalledTimes(1);
    expect(harness.callOrder).toEqual([
      'load-content',
      'initialize',
      'run-migrations',
      'seed-content',
      'destroy',
    ]);
  });

  it('executes with a fresh DataSource that does not log query parameters', async () => {
    const configuredDataSource = new DataSource({
      type: 'postgres',
      url: 'postgresql://test:test@localhost:5432/test',
      entities: [],
      migrations: [],
      logging: true,
    });
    const commandDataSource =
      createLearningContentCommandDataSource(configuredDataSource);
    jest
      .spyOn(commandDataSource, 'initialize')
      .mockResolvedValue(commandDataSource);
    jest.spyOn(commandDataSource, 'runMigrations').mockResolvedValue([]);
    jest.spyOn(commandDataSource, 'destroy').mockResolvedValue();
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    const seed = jest.fn((executedDataSource: DataSource) => {
      executedDataSource.logger.logQuery('SELECT $1', [
        'private learning content',
      ]);
      return Promise.resolve(summary);
    });

    try {
      await prepareLearningDatabase({
        load: () => bundle,
        dataSource: commandDataSource,
        seed,
      });

      expect(commandDataSource).not.toBe(configuredDataSource);
      expect(commandDataSource.options.logging).toBe(false);
      expect(seed).toHaveBeenCalledWith(commandDataSource, bundle);
      expect(consoleLog).not.toHaveBeenCalled();
    } finally {
      consoleLog.mockRestore();
    }
  });
});

describe('seedLearningContentDatabase', () => {
  it('validates, connects, seeds, and closes in order', async () => {
    const harness = createHarness();

    await expect(seedLearningContentDatabase(harness)).resolves.toEqual(
      summary,
    );

    expect(harness.callOrder).toEqual([
      'load-content',
      'initialize',
      'seed-content',
      'destroy',
    ]);
  });

  it('does not connect when content is invalid', async () => {
    const harness = createHarness();
    harness.load.mockImplementation(() => {
      throw new Error('invalid content');
    });

    await expect(seedLearningContentDatabase(harness)).rejects.toThrow(
      'invalid content',
    );

    expect(harness.initialize).not.toHaveBeenCalled();
    expect(harness.destroy).not.toHaveBeenCalled();
  });

  it('destroys the initialized DataSource when seeding fails', async () => {
    const harness = createHarness();
    const seedError = new Error('seed failed');
    harness.seed.mockImplementation(() => {
      harness.callOrder.push('seed-content');
      return Promise.reject(seedError);
    });

    await expect(seedLearningContentDatabase(harness)).rejects.toBe(seedError);

    expect(harness.destroy).toHaveBeenCalledTimes(1);
    expect(harness.callOrder).toEqual([
      'load-content',
      'initialize',
      'seed-content',
      'destroy',
    ]);
  });
});
