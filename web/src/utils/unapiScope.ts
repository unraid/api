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

function getObserverRoot(root: ScopeRoot): Element | null {
  if (root instanceof Document) {
    return root.body ?? root.documentElement;
  }

  if (root instanceof DocumentFragment) {
    return root.firstElementChild;
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

export function ensureUnapiScope(target?: Element | null): boolean {
  if (!isBrowser || !target) {
    return false;
  }

  return addScopeClass(target);
}

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

  // Apply immediately for any current matches
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
