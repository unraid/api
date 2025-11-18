interface Container {
  type: string;
  parent?: Container;
}

interface Rule extends Container {
  selector?: string;
  selectors?: string[];
}

interface AtRule extends Container {
  name: string;
  params: string;
}

type PostcssPlugin = {
  postcssPlugin: string;
  Rule?(rule: Rule): void;
};

type PluginCreator<T> = {
  (opts?: T): PostcssPlugin;
  postcss?: boolean;
};

export interface ScopeOptions {
  scope?: string;
  layers?: string[];
  includeRoot?: boolean;
}

const DEFAULT_SCOPE = '.unapi';
const DEFAULT_LAYERS = ['*'];
const DEFAULT_INCLUDE_ROOT = true;

const KEYFRAME_AT_RULES = new Set(['keyframes']);
const NON_SCOPED_AT_RULES = new Set(['font-face', 'page']);
const MERGE_WITH_SCOPE_PATTERNS: RegExp[] = [/^\.has-custom-/, /^\.dark\b/];
const UNSCOPED_PATTERNS: RegExp[] = [/^\.Theme--/];

function shouldScopeRule(rule: Rule, targetLayers: Set<string>, includeRootRules: boolean): boolean {
  const hasSelectorString = typeof rule.selector === 'string' && rule.selector.length > 0;
  const hasSelectorArray = Array.isArray(rule.selectors) && rule.selectors.length > 0;

  // Skip rules without selectors (e.g. @font-face) or nested keyframe steps
  if (!hasSelectorString && !hasSelectorArray) {
    return false;
  }

  const directParent = rule.parent;
  if (directParent?.type === 'atrule') {
    const parentAtRule = directParent as AtRule;
    const parentAtRuleName = parentAtRule.name.toLowerCase();
    if (KEYFRAME_AT_RULES.has(parentAtRuleName) || parentAtRuleName.endsWith('keyframes')) {
      return false;
    }
    if (NON_SCOPED_AT_RULES.has(parentAtRuleName)) {
      return false;
    }
  }

  const includeAllLayers = targetLayers.has('*');

  // Traverse ancestors to find the enclosing @layer declaration
  let current: Container | undefined = rule.parent ?? undefined;

  while (current) {
    if (current.type === 'atrule') {
      const currentAtRule = current as AtRule;
      if (currentAtRule.name === 'layer') {
        const layerNames = currentAtRule.params
          .split(',')
          .map((name: string) => name.trim())
          .filter(Boolean);
        if (includeAllLayers) {
          return true;
        }
        return layerNames.some((name) => targetLayers.has(name));
      }
    }
    current = current.parent ?? undefined;
  }

  // If the rule is not inside any @layer, treat it as root-level CSS
  return includeRootRules;
}

function hasScope(selector: string, scope: string): boolean {
  return selector.includes(scope);
}

function prefixSelector(selector: string, scope: string): string {
  const trimmed = selector.trim();

  if (!trimmed) {
    return selector;
  }

  if (hasScope(trimmed, scope)) {
    return trimmed;
  }

  // Do not prefix :host selectors – they are only valid at the top level
  if (trimmed.startsWith(':host')) {
    return trimmed;
  }

  // Do not scope Theme-- classes - they should remain global
  const firstToken = trimmed.split(/[\s>+~]/, 1)[0] ?? '';
  if (!firstToken.includes('\\:') && UNSCOPED_PATTERNS.some((pattern) => pattern.test(firstToken))) {
    return trimmed;
  }

  if (trimmed === ':root') {
    return scope;
  }

  if (trimmed.startsWith(':root')) {
    return `${scope}${trimmed.slice(':root'.length)}`;
  }

  const shouldMergeWithScope =
    !firstToken.includes('\\:') && MERGE_WITH_SCOPE_PATTERNS.some((pattern) => pattern.test(firstToken));

  if (shouldMergeWithScope) {
    return `${scope}${trimmed}`;
  }

  return `${scope} ${trimmed}`;
}

export const scopeTailwindToUnapi: PluginCreator<ScopeOptions> = (options: ScopeOptions = {}) => {
  const scope = options.scope ?? DEFAULT_SCOPE;
  const layers = options.layers ?? DEFAULT_LAYERS;
  const includeRootRules = options.includeRoot ?? DEFAULT_INCLUDE_ROOT;
  const targetLayers = new Set<string>(layers);

  return {
    postcssPlugin: 'scope-tailwind-to-unapi',
    Rule(rule: Rule) {
      if (!shouldScopeRule(rule, targetLayers, includeRootRules)) {
        return;
      }

      const hasSelectorArray = Array.isArray(rule.selectors);
      let selectors: string[] = [];

      if (hasSelectorArray && rule.selectors) {
        selectors = rule.selectors;
      } else if (rule.selector) {
        selectors = [rule.selector];
      }

      if (!selectors.length) {
        return;
      }

      const scopedSelectors = selectors.map((selector: string) => prefixSelector(selector, scope));

      if (hasSelectorArray) {
        rule.selectors = scopedSelectors;
      } else {
        rule.selector = scopedSelectors.join(', ');
      }
    },
  };
};

scopeTailwindToUnapi.postcss = true;

export default scopeTailwindToUnapi;
