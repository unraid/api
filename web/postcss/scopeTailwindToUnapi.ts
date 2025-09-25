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
const MERGE_WITH_SCOPE_PATTERNS: RegExp[] = [/^\.theme-/, /^\.has-custom-/, /^\.dark\b/];

function shouldScopeRule(rule: Rule, targetLayers: Set<string>, includeRootRules: boolean): boolean {
  // Skip rules without selectors (e.g. @font-face) or nested keyframe steps
  if (!rule.selector) {
    return false;
  }

  const directParent = rule.parent;
  if (directParent?.type === 'atrule') {
    const parentAtRule = directParent as AtRule;
    if (KEYFRAME_AT_RULES.has(parentAtRule.name)) {
      return false;
    }
    if (NON_SCOPED_AT_RULES.has(parentAtRule.name)) {
      return false;
    }
  }

  const includeAllLayers = targetLayers.has('*');

  // Traverse ancestors to find the enclosing @layer declaration
  let current: Container | undefined = rule.parent ?? undefined;
  let inspectedLayer = false;

  while (current) {
    if (current.type === 'atrule') {
      const currentAtRule = current as AtRule;
      if (currentAtRule.name === 'layer') {
        inspectedLayer = true;
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
  return includeRootRules && !inspectedLayer;
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

  if (trimmed === ':root') {
    return scope;
  }

  if (trimmed.startsWith(':root')) {
    return `${scope}${trimmed.slice(':root'.length)}`;
  }

  const hasCombinator = /[\s>+~]/.test(trimmed);
  const shouldMergeWithScope =
    !hasCombinator &&
    !trimmed.includes('\\:') &&
    MERGE_WITH_SCOPE_PATTERNS.some((pattern) => pattern.test(trimmed));

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

      const selectors = rule.selectors;
      if (!selectors?.length) {
        return;
      }

      const scopedSelectors = selectors.map((selector: string) => prefixSelector(selector, scope));
      rule.selectors = scopedSelectors;
    },
  };
};

scopeTailwindToUnapi.postcss = true;

export default scopeTailwindToUnapi;
