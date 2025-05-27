import { defineCustomElement } from 'vue';
import '@/styles/index.css';
import * as Components from '@/components';
import kebabCase from 'kebab-case';

const debugImports = process.env.NODE_ENV !== 'production';

type RegisterParams = {
  namePrefix?: string;
  pathToSharedCss?: string;
};

type CustomElementComponent = {
  styles?: string[];
  render?: () => unknown;
  setup?: () => unknown;
  [key: string]: unknown;
};

export function registerAllComponents(params: RegisterParams = {}) {
  const { namePrefix = 'uui', pathToSharedCss = './src/styles/index.css' } = params;

  Object.entries(Components).forEach(([name, originalComponent]) => {
    try {
      if (typeof originalComponent !== 'object' || originalComponent === null) {
        if (debugImports) {
          console.log(`[register components] Skipping non-object: ${name}`);
        }
        return;
      }

      if (typeof originalComponent === 'function') {
        if (debugImports) {
          console.log(`[register components] Skipping function: ${name}`);
        }
        return;
      }

      if (!('render' in originalComponent || 'setup' in originalComponent)) {
        if (debugImports) {
          console.log(`[register components] Skipping non-component object: ${name}`);
        }
        return;
      }

      const component = originalComponent as CustomElementComponent;

      component.styles ??= [];
      component.styles.unshift(`@import "${pathToSharedCss}"`);

      let elementName = kebabCase(name);
      if (!elementName) {
        console.log('[register components] Could not translate component name to kebab-case:', name);
        elementName = name;
      }
      elementName = namePrefix + elementName;

      if (debugImports) {
        console.log(name, elementName, component.styles);
      }

      customElements.define(elementName, defineCustomElement(component as object));
    } catch (error) {
      console.error(`[register components] Error registering component ${name}:`, error);
    }
  });
}
