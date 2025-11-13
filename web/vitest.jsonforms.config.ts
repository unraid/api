import baseConfig from './vitest.config';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(baseConfig, {
  test: {
    include: ['src/__tests__/jsonforms-i18n.spec.ts'],
    maxWorkers: 1,
  },
});
