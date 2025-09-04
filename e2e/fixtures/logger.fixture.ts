import { test as base, TestInfo } from '@playwright/test';
import { TestLogger, interceptConsole } from '../utils/logger';

export type LoggerFixtures = {
  logger: TestLogger;
};

export const test = base.extend<LoggerFixtures>({
  logger: [async ({ browserName }, use, testInfo) => {
    const logger = new TestLogger();
    logger.attachToTest(testInfo);
    
    const restoreConsole = interceptConsole(logger);
    
    logger.info(`Starting test: ${testInfo.title}`);
    logger.debug(`Test file: ${testInfo.file}`);
    logger.debug(`Browser: ${browserName} (Project: ${testInfo.project.name})`);
    logger.debug(`Worker: #${testInfo.workerIndex}`);
    logger.debug(`Parallel: ${testInfo.parallelIndex}`);
    
    await use(logger);
    
    logger.info(`Test completed with status: ${testInfo.status}`);
    if (testInfo.errors.length > 0) {
      logger.error('Test errors:', { errors: testInfo.errors });
    }
    if (testInfo.duration) {
      logger.info(`Test duration: ${testInfo.duration}ms`);
    }
    
    restoreConsole();
    logger.detachFromTest();
  }, { auto: true }]
});

export { expect } from '@playwright/test';