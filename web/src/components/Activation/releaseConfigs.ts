import { compare } from 'semver';

export interface ReleaseStepConfig {
  id: 'timezone' | 'plugins';
  condition?: () => boolean | Promise<boolean>;
  required?: boolean;
}

export interface ReleaseConfig {
  version: string;
  steps: ReleaseStepConfig[];
  minVersion?: string;
}

const releaseConfigs: ReleaseConfig[] = [
  {
    version: '7.0.0',
    steps: [
      {
        id: 'timezone',
        required: true,
      },
      {
        id: 'plugins',
        required: false,
      },
    ],
  },
];

export const getReleaseConfig = (
  fromVersion: string | undefined,
  toVersion: string
): ReleaseConfig | null => {
  if (!fromVersion) {
    return null;
  }

  const applicableConfigs = releaseConfigs.filter((config) => {
    try {
      const isTargetVersion = compare(toVersion, config.version) >= 0;
      const isAfterMinVersion = !config.minVersion || compare(fromVersion, config.minVersion) >= 0;

      return isTargetVersion && isAfterMinVersion;
    } catch {
      return false;
    }
  });

  if (applicableConfigs.length === 0) {
    return null;
  }

  applicableConfigs.sort((a, b) => compare(b.version, a.version));
  return applicableConfigs[0];
};

export const getUpgradeSteps = async (
  fromVersion: string | undefined,
  toVersion: string
): Promise<ReleaseStepConfig[]> => {
  const config = getReleaseConfig(fromVersion, toVersion);

  if (!config) {
    return [];
  }

  const steps: ReleaseStepConfig[] = [];

  for (const step of config.steps) {
    if (step.condition) {
      const shouldShow = await step.condition();
      if (shouldShow) {
        steps.push(step);
      }
    } else {
      steps.push(step);
    }
  }

  return steps;
};
