import { defineCustomElement } from 'vue';
import '@app/styles/index.css';
import * as Components from '@/components';
import kebabCase from 'kebab-case';

const debugImports = process.env.NODE_ENV !== 'production';

type RegisterParams = {
  namePrefix?: string;
  pathToSharedCss?: string;
};

export function registerAllComponents(params: RegisterParams = {}) {
  const { namePrefix = 'uui', pathToSharedCss = './src/styles/index.css' } = params;
  Object.entries(Components).forEach(([name, component]) => {
    // add our shared css to each web component
    component.styles ??= [];
    component.styles.unshift(`@import "${pathToSharedCss}"`);

    // translate ui component names from PascalCase to kebab-case
    let elementName = kebabCase(name);
    if (!elementName) {
      console.log('[register components] Could not translate component name to kebab-case:', name);
      elementName = name;
    }
    elementName = namePrefix + elementName;

    // register custom web components
    if (debugImports) {
      console.log(name, elementName, component.styles);
    }
    customElements.define(elementName, defineCustomElement(component));
  });
}
