import { test as base, TestInfo } from '@playwright/test';
import { TestLogger, interceptConsole } from '../utils/logger';

export type LoggerFixtures = {
  logger: TestLogger;
};

export const test = base.extend<LoggerFixtures>({
  logger: [async ({ }, use, testInfo) => {
    const logger = new TestLogger();
    logger.attachToTest(testInfo);
    
    const restoreConsole = interceptConsole(logger);
    
    logger.info(`Starting test: ${testInfo.title}`);
    logger.debug(`Test file: ${testInfo.file}`);
    logger.debug(`Project: ${testInfo.project.name}`);
    
    await use(logger);
    
    logger.info(`Test completed with status: ${testInfo.status}`);
    if (testInfo.errors.length > 0) {
      logger.error('Test errors:', { errors: testInfo.errors });
    }
    
    restoreConsole();
    logger.detachFromTest();
  }, { auto: true }]
});

export { expect } from '@playwright/test';