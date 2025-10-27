import { performance } from 'node:perf_hooks';

import { describe, expect, it } from 'vitest';

import scopeTailwindToUnapi from '../../postcss/scopeTailwindToUnapi';

type LayerAtRule = {
  type: string;
  name: string;
  params: string;
  parent?: LayerAtRule;
};

type MutableRule = {
  type: string;
  selector?: string;
  selectors?: string[];
  parent?: LayerAtRule;
};

function createRule(selectors: string[], layer = 'utilities'): MutableRule {
  return {
    type: 'rule',
    selector: selectors.join(', '),
    selectors: [...selectors],
    parent: {
      type: 'atrule',
      name: 'layer',
      params: layer,
    },
  };
}

describe('scopeTailwindToUnapi plugin', () => {
  it('prefixes simple selectors with .unapi scope', () => {
    const plugin = scopeTailwindToUnapi();
    const rule = createRule(['.btn-primary']);

    plugin.Rule?.(rule);

    expect(rule.selectors).toEqual(['.unapi .btn-primary']);
  });

  it('merges variant class selectors into the scope', () => {
    const plugin = scopeTailwindToUnapi();
    const rule = createRule(['.dark .btn-secondary']);

    plugin.Rule?.(rule);

    expect(rule.selectors).toEqual(['.unapi.dark .btn-secondary']);
  });

  it('handles rules expressed with selector strings only', () => {
    const plugin = scopeTailwindToUnapi();
    const rule: MutableRule = {
      type: 'rule',
      selector: '.card',
      parent: {
        type: 'atrule',
        name: 'layer',
        params: 'components',
      },
    };

    plugin.Rule?.(rule);

    expect(rule.selector).toBe('.unapi .card');
  });

  it('scopes html and body selectors to the root scope element', () => {
    const plugin = scopeTailwindToUnapi();
    const rule = createRule(['html', 'body.dark']);

    plugin.Rule?.(rule);

    expect(rule.selectors).toEqual(['.unapi', '.unapi.dark']);
  });

  it('merges theme mode selectors onto the unapi scope', () => {
    const plugin = scopeTailwindToUnapi();
    const rule = createRule(['.light', '.dark']);

    plugin.Rule?.(rule);

    expect(rule.selectors).toEqual(['.unapi.light', '.unapi.dark']);
  });

  it('processes large rule sets within the target budget', () => {
    const plugin = scopeTailwindToUnapi();
    const totalRules = 10_000;

    const start = performance.now();

    for (let index = 0; index < totalRules; index += 1) {
      const rule = createRule([`.test-${index}`]);
      plugin.Rule?.(rule);
    }

    const durationMs = performance.now() - start;

    // Ensure we stay well under 1 second even on slower CI hosts.
    expect(durationMs).toBeLessThan(1_000);
  });
});
