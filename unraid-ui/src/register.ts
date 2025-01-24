import { defineCustomElement } from 'vue';
import './styles/index.css';
import * as Components from '@/components';
import kebabCase from 'kebab-case';
import { Badge, BrandLoading } from '.';

const debugImports = true;

export function registerCommonComponents() {
  Badge.styles = ['@import "./src/styles/index.css"'];
  const UnraidBadge = defineCustomElement(Badge);
  // const UnraidBadge = defineCustomElement({
  //   ...Badge,
  //   styles: ['@import "./src/styles/index.css"']
  // });
  customElements.define('unraid-badge', UnraidBadge);
}

export function registerAllComponents(namePrefix = 'unraid') {
  // registerCommonComponents();
  Object.entries(Components).forEach(([name, component]) => {
    // add our shared css to each web component
    component.styles ??= [];
    component.styles.unshift('@import "./src/styles/index.css"');

    if (debugImports) {
      console.log(name, component.styles);
    }

    let elementName = kebabCase(name);
    if (!elementName) {
      console.log('[register components] Could not translate component name to kebab-case:', name);
      elementName = name;
    }
    customElements.define(namePrefix + elementName, defineCustomElement(component));
  });
}

registerAllComponents();
