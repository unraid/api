const CONFLICTING_ID_SEGMENT = 'reka-dropdown-';
const SAFE_ID_SEGMENT = 'menu-';

const ATTRIBUTE_NAMES = ['id', 'aria-controls', 'aria-labelledby'] as const;
const SELECTOR = ATTRIBUTE_NAMES.map((attribute) => `[${attribute}*="${CONFLICTING_ID_SEGMENT}"]`).join(
  ', '
);

let compatibilityObserver: MutationObserver | null = null;

function normalizeValue(value: string): string {
  return value.replace(/reka-dropdown-menu-/g, `reka-${SAFE_ID_SEGMENT}`);
}

function sanitizeAttribute(element: Element, attributeName: (typeof ATTRIBUTE_NAMES)[number]): void {
  const value = element.getAttribute(attributeName);
  if (!value || !value.includes(CONFLICTING_ID_SEGMENT)) {
    return;
  }

  element.setAttribute(attributeName, normalizeValue(value));
}

function sanitizeElement(element: Element): void {
  ATTRIBUTE_NAMES.forEach((attributeName) => {
    sanitizeAttribute(element, attributeName);
  });
}

function sanitizeTree(root: ParentNode): void {
  root.querySelectorAll(SELECTOR).forEach((element) => {
    sanitizeElement(element);
  });
}

export function enableDropdownIdCompatibility(doc: Document = document): void {
  if (compatibilityObserver) {
    sanitizeTree(doc);
    return;
  }

  sanitizeTree(doc);

  const observerRoot = doc.body ?? doc.documentElement;
  if (!observerRoot) {
    return;
  }

  compatibilityObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        const attributeName = mutation.attributeName;
        if (
          attributeName === 'id' ||
          attributeName === 'aria-controls' ||
          attributeName === 'aria-labelledby'
        ) {
          sanitizeAttribute(mutation.target, attributeName);
        }
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) {
          return;
        }

        sanitizeElement(node);
        sanitizeTree(node);
      });
    });
  });

  compatibilityObserver.observe(observerRoot, {
    attributes: true,
    attributeFilter: [...ATTRIBUTE_NAMES],
    childList: true,
    subtree: true,
  });
}
