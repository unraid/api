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

  it('applies banner styles to the native WebGUI header outside the app scope', () => {
    const plugin = scopeTailwindToUnapi();
    const container = document.createElement('div');
    container.innerHTML =
      '<div id="header" class="image"><unraid-user-profile class="unapi"></unraid-user-profile></div>';
    document.body.append(container);
    document.documentElement.classList.add('has-banner-gradient');
    const rule = createRule([
      '#header.image:not(.unraid-consolidated-header)',
      '.has-banner-gradient #header.image:not(.unraid-consolidated-header)',
      '.has-banner-gradient #header.image:not(.unraid-consolidated-header)::before',
      '.has-banner-gradient #header.image:not(.unraid-consolidated-header):before',
      '.has-banner-gradient #header.image:not(.unraid-consolidated-header) > *',
    ]);

    try {
      plugin.Rule?.(rule);

      for (const selector of rule.selectors ?? []) {
        expect(document.querySelector(selector.replace(/::?before$/, ''))).not.toBeNull();
      }

      const header = container.querySelector('#header');
      header?.classList.add('unraid-consolidated-header');
      header?.replaceChildren(document.createElement('unraid-header'));
      for (const selector of rule.selectors ?? []) {
        expect(document.querySelector(selector.replace(/::?before$/, ''))).toBeNull();
      }
      header?.classList.remove('unraid-consolidated-header');
      header?.replaceChildren(document.createElement('unraid-user-profile'));

      document.documentElement.classList.remove('has-banner-gradient');
      for (const selector of rule.selectors?.slice(1) ?? []) {
        expect(document.querySelector(selector.replace(/::?before$/, ''))).toBeNull();
      }
    } finally {
      container.remove();
      document.documentElement.classList.remove('has-banner-gradient');
    }
  });

  it('still scopes unrelated header and banner selectors', () => {
    const plugin = scopeTailwindToUnapi();
    const rule = createRule(['#header.image-preview', '.has-banner-gradient .card']);

    plugin.Rule?.(rule);

    expect(rule.selectors).toEqual([
      '.unapi #header.image-preview',
      '.unapi .has-banner-gradient .card',
    ]);
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
