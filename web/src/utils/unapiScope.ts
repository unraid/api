/**
 * Utilities for scoping Tailwind CSS styles to elements within the Unraid WebGUI.
 *
 * This module works in conjunction with the PostCSS plugin (scopeTailwindToUnapi.ts)
 * which prefixes all Tailwind CSS rules with `.unapi`. Elements must have the `unapi`
 * class added to receive scoped Tailwind styles, preventing conflicts with the legacy
 * Unraid WebGUI interface.
 */

/** The class name used to scope Tailwind CSS styles to elements within the Unraid WebGUI. */
const UNAPI_SCOPE_CLASS = 'unapi';

type ScopeRoot = Document | DocumentFragment | Element;

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const observerState: {
  observer: MutationObserver | null;
  selectors: Set<string>;
  selectorList: string;
} = {
  observer: null,
  selectors: new Set<string>(),
  selectorList: '',
};

function toSelectorArray(selectors: Iterable<string> | string): string[] {
  if (typeof selectors === 'string') {
    return selectors
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean);
  }

  return Array.from(selectors).flatMap((selector) =>
    selector
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
  );
}

function updateSelectorList(): void {
  observerState.selectorList = Array.from(observerState.selectors).join(',');
}

function getQueryRoot(root?: ScopeRoot | null): ScopeRoot {
  if (!root) {
    return document;
  }
  return root;
}

function getObserverRoot(root: ScopeRoot): Node | null {
  if (root instanceof Document) {
    return root.body ?? root.documentElement;
  }

  // DocumentFragment can be observed directly via MutationObserver
  if (root instanceof DocumentFragment) {
    return root;
  }

  return root;
}

function addScopeClass(element: Element): boolean {
  if (element.classList.contains(UNAPI_SCOPE_CLASS)) {
    return false;
  }

  element.classList.add(UNAPI_SCOPE_CLASS);
  return true;
}

/**
 * Adds the `unapi` class to a single element to enable scoped Tailwind styles.
 *
 * @param target - The element to scope, or null/undefined for no-op
 * @returns true if the class was added, false if already present or invalid
 */
export function ensureUnapiScope(target?: Element | null): boolean {
  if (!isBrowser || !target) {
    return false;
  }

  return addScopeClass(target);
}

/**
 * Adds the `unapi` class to all elements matching the given selectors.
 * Useful for applying scope to multiple existing elements at once.
 *
 * @param selectors - CSS selectors (string or array) to match elements
 * @param root - Root element to query within (defaults to document)
 */
export function ensureUnapiScopeForSelectors(
  selectors: Iterable<string> | string,
  root?: ScopeRoot | null
): void {
  if (!isBrowser) {
    return;
  }

  const selectorTokens = toSelectorArray(selectors);
  if (!selectorTokens.length) {
    return;
  }

  const queryRoot = getQueryRoot(root);

  selectorTokens.forEach((selector) => {
    queryRoot.querySelectorAll(selector).forEach((element) => {
      addScopeClass(element);
    });
  });
}

export type ScopeMatchHandler = (element: Element) => void;

/**
 * Observes the DOM for new elements matching the given selectors and automatically
 * adds the `unapi` class to them. Uses a single MutationObserver shared across all
 * calls to efficiently watch for dynamic content.
 *
 * Applies scope immediately to existing matching elements, then watches for future additions.
 *
 * @param selectors - CSS selectors (string or array) to watch for
 * @param root - Root element to observe within (defaults to document)
 * @param onMatch - Optional callback fired when a new matching element is found and scoped
 */
export function observeUnapiScope(
  selectors: Iterable<string> | string,
  root?: ScopeRoot | null,
  onMatch?: ScopeMatchHandler
): void {
  if (!isBrowser) {
    return;
  }

  const selectorTokens = toSelectorArray(selectors);
  if (!selectorTokens.length) {
    return;
  }

  selectorTokens.forEach((selector) => observerState.selectors.add(selector));
  updateSelectorList();

  ensureUnapiScopeForSelectors(selectorTokens, root);

  if (observerState.observer) {
    return;
  }

  const observerRoot = getObserverRoot(getQueryRoot(root));
  if (!observerRoot) {
    return;
  }

  observerState.observer = new MutationObserver((mutations) => {
    if (!observerState.selectorList) {
      return;
    }

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) {
          return;
        }

        if (node.matches(observerState.selectorList)) {
          addScopeClass(node);
          onMatch?.(node);
        }

        node.querySelectorAll(observerState.selectorList).forEach((matched) => {
          addScopeClass(matched);
          onMatch?.(matched);
        });
      });
    });
  });

  observerState.observer.observe(observerRoot, {
    childList: true,
    subtree: true,
  });
}

export { UNAPI_SCOPE_CLASS };
