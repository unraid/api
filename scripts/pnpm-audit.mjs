#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const cwd = process.cwd();
const args = process.argv.slice(2).filter((arg) => arg !== '--json');
const audit = spawnSync('pnpm', ['audit', '--json', ...args], {
  cwd,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (audit.stderr) {
  process.stderr.write(audit.stderr);
}

let report;

try {
  report = JSON.parse(audit.stdout);
} catch {
  if (audit.stdout) {
    process.stdout.write(audit.stdout);
  }
  process.exitCode = audit.status ?? 1;
}

if (report && report.error) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = audit.status || 1;
  report = undefined;
}

if (report && !isRecognizedAuditReport(report)) {
  process.stderr.write('pnpm audit returned an unrecognized report shape; failing closed.\n');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = audit.status || 1;
  report = undefined;
}

if (report) {
  const workspaceImporters = getWorkspaceImporters(cwd);
  const auditConfig = readAuditConfig(cwd);

  if (Array.isArray(report.actions)) {
    report.actions = report.actions.filter((action) => !isWorkspaceImporterAction(action, workspaceImporters));
  }

  applyAuditConfigIgnores(report, auditConfig);
  pruneActionsWithoutAdvisories(report);
  updateVulnerabilityMetadata(report);

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = Object.keys(report.advisories ?? {}).length === 0 ? 0 : (audit.status ?? 1);
}

function isRecognizedAuditReport(report) {
  return (
    typeof report === 'object' &&
    report !== null &&
    typeof report.advisories === 'object' &&
    report.advisories !== null &&
    typeof report.metadata === 'object' &&
    report.metadata !== null
  );
}

function pruneActionsWithoutAdvisories(report) {
  const advisoryIds = new Set(Object.keys(report.advisories ?? {}).map((id) => Number(id)));

  if (!Array.isArray(report.actions)) {
    return;
  }

  report.actions = report.actions
    .map((action) => {
      if (!Array.isArray(action.resolves)) {
        return action;
      }

      const resolves = action.resolves.filter((resolve) => advisoryIds.has(resolve.id));

      if (resolves.length === action.resolves.length) {
        return action;
      }

      return {
        ...action,
        resolves,
      };
    })
    .filter((action) => !Array.isArray(action.resolves) || action.resolves.length > 0);
}

function applyAuditConfigIgnores(report, auditConfig) {
  if (!report.advisories || typeof report.advisories !== 'object') {
    return;
  }

  const ignoredAdvisoryIds = new Set();

  for (const [id, advisory] of Object.entries(report.advisories)) {
    const cves = Array.isArray(advisory?.cves) ? advisory.cves : [];
    const ghsa = advisory?.github_advisory_id;

    if (
      cves.some((cve) => auditConfig.ignoreCves.has(cve)) ||
      (typeof ghsa === 'string' && auditConfig.ignoreGhsas.has(ghsa))
    ) {
      ignoredAdvisoryIds.add(Number(id));
      delete report.advisories[id];
    }
  }

  if (ignoredAdvisoryIds.size === 0) {
    return;
  }

  if (Array.isArray(report.actions)) {
    report.actions = report.actions
      .map((action) => {
        if (!Array.isArray(action.resolves)) {
          return action;
        }
        const resolves = action.resolves.filter((resolve) => !ignoredAdvisoryIds.has(resolve.id));

        if (resolves.length === action.resolves.length) {
          return action;
        }

        return {
          ...action,
          resolves,
        };
      })
      .filter((action) => !Array.isArray(action.resolves) || action.resolves.length > 0);
  }

}

function updateVulnerabilityMetadata(report) {
  const counts = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };

  for (const advisory of Object.values(report.advisories ?? {})) {
    if (typeof advisory?.severity === 'string' && advisory.severity in counts) {
      counts[advisory.severity] += 1;
    }
  }

  report.metadata = {
    ...report.metadata,
    vulnerabilities: counts,
  };
}

function readAuditConfig(root) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const auditConfig = packageJson.pnpm?.auditConfig ?? {};

  return {
    ignoreCves: new Set(Array.isArray(auditConfig.ignoreCves) ? auditConfig.ignoreCves : []),
    ignoreGhsas: new Set(Array.isArray(auditConfig.ignoreGhsas) ? auditConfig.ignoreGhsas : []),
  };
}

function isWorkspaceImporterAction(action, workspaceImporters) {
  if (action?.action !== 'install' || typeof action.module !== 'string') {
    return false;
  }

  const workspacePackageName = workspaceImporters.get(action.module);

  if (!workspacePackageName || workspacePackageName === action.module || !Array.isArray(action.resolves)) {
    return false;
  }

  return action.resolves.every((resolve) => {
    return typeof resolve?.path === 'string' && resolve.path.startsWith(`${action.module}>`);
  });
}

function getWorkspaceImporters(root) {
  const importers = new Map();
  const workspace = readWorkspacePackagePatterns(root);

  for (const pattern of workspace) {
    for (const packageDir of expandWorkspacePattern(root, pattern)) {
      const packageJsonPath = join(packageDir, 'package.json');

      if (!existsSync(packageJsonPath)) {
        continue;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const importer = relative(root, packageDir);

      if (typeof packageJson.name === 'string' && importer) {
        importers.set(importer, packageJson.name);
      }
    }
  }

  return importers;
}

function readWorkspacePackagePatterns(root) {
  const workspaceYaml = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const patterns = [];

  for (const line of workspaceYaml.split('\n')) {
    const match = line.match(/^\s*-\s*["']?([^"']+)["']?\s*$/);

    if (match?.[1]) {
      patterns.push(match[1].replace(/^\.\//, ''));
    }
  }

  return patterns;
}

function expandWorkspacePattern(root, pattern) {
  if (pattern.endsWith('/*')) {
    const parent = join(root, pattern.slice(0, -2));

    if (!existsSync(parent)) {
      return [];
    }

    return readdirSync(parent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(parent, entry.name));
  }

  return [join(root, pattern)];
}
