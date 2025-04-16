import { defineCustomElement } from 'vue';
import '@/styles/index.css';
import * as Components from '@/components';
import kebabCase from 'kebab-case';

const debugImports = process.env.NODE_ENV !== 'production';

type RegisterParams = {
  namePrefix?: string;
  pathToSharedCss?: string;
};

// Type for our simplified Vue component representation
type CustomElementComponent = {
  styles?: string[];
  render?: Function;
  setup?: Function;
  [key: string]: any;
};

export function registerAllComponents(params: RegisterParams = {}) {
  const { namePrefix = 'uui', pathToSharedCss = './src/styles/index.css' } = params;
  
  Object.entries(Components).forEach(([name, originalComponent]) => {
    // Use explicit type assertion instead of type predicates
    try {
      // Skip anything that doesn't look like a Vue component
      if (typeof originalComponent !== 'object' || originalComponent === null) {
        if (debugImports) {
          console.log(`[register components] Skipping non-object: ${name}`);
        }
        return;
      }
      
      // Skip function values
      if (typeof originalComponent === 'function') {
        if (debugImports) {
          console.log(`[register components] Skipping function: ${name}`);
        }
        return;
      }
      
      // Skip if not a Vue component
      if (!('render' in originalComponent || 'setup' in originalComponent)) {
        if (debugImports) {
          console.log(`[register components] Skipping non-component object: ${name}`);
        }
        return;
      }

      // Now we can safely use type assertion since we've validated the component
      const component = originalComponent as CustomElementComponent;
      
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
      
      // Use appropriate casting for defineCustomElement
      customElements.define(elementName, defineCustomElement(component as any));
    } catch (error) {
      console.error(`[register components] Error registering component ${name}:`, error);
    }
  });
}
