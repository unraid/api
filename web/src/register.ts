import { defineCustomElementSFC } from 'vue-web-component-wrapper';
import '~/assets/main.css';

// Import web component plugins  
import webComponentPlugins from '@/src/plugins/web-component-plugins';
import kebabCase from 'kebab-case';

const debugImports = process.env.NODE_ENV !== 'production';

type RegisterParams = {
  namePrefix?: string;
  pathToSharedCss?: string;
  sharedCssContent?: string;
};

type CustomElementComponent = {
  styles?: string[];
  render?: () => unknown;
  setup?: () => unknown;
  [key: string]: unknown;
};

// Import all web components
const webComponentModules = import.meta.glob('@/components/**/*.ce.vue', { eager: true });

export function registerAllComponents(params: RegisterParams = {}) {
  const { namePrefix = 'unraid', pathToSharedCss = '@/assets/main.css', sharedCssContent } = params;

  Object.entries(webComponentModules).forEach(([path, module]) => {
    try {
      const component = (module as any).default;
      if (!component) {
        if (debugImports) {
          console.log(`[register components] No default export found for: ${path}`);
        }
        return;
      }

      // Extract component name from path
      const fileName = path.split('/').pop()?.replace('.ce.vue', '');
      if (!fileName) {
        if (debugImports) {
          console.log(`[register components] Could not extract filename from: ${path}`);
        }
        return;
      }

      // Convert filename to kebab-case and remove leading hyphen if present
      let elementName = kebabCase(fileName);
      if (!elementName) {
        console.log('[register components] Could not translate component name to kebab-case:', fileName);
        elementName = fileName.toLowerCase();
      } else {
        // Remove leading hyphen that kebab-case adds for PascalCase inputs
        elementName = elementName.replace(/^-/, '');
      }
      
      // Debug the conversion
      if (debugImports) {
        console.log(`[register components] Converting: "${fileName}" → "${elementName}"`);
      }
      
      // Add prefix if it doesn't already start with it
      // But avoid double prefixing (e.g., "unraid-unraid-")
      if (!elementName.startsWith(namePrefix + '-') && !elementName.startsWith(namePrefix)) {
        elementName = `${namePrefix}-${elementName}`;
      }

      if (debugImports) {
        console.log(`[register components] Final name: "${elementName}"`);
      }

      // Check if already registered to avoid duplicate registration
      if (customElements.get(elementName)) {
        if (debugImports) {
          console.log(`[register components] "${elementName}" is already registered, skipping`);
        }
        return;
      }

      // Use defineCustomElementSFC with shadow DOM and plugins
      // Pass plugins as a function to ensure fresh instance per component
      const CustomElement = defineCustomElementSFC(component, {
        shadowRoot: true,
        plugins: [(app) => webComponentPlugins(app)]
      });
      
      customElements.define(elementName, CustomElement);
      
      if (debugImports) {
        console.log(`[register components] Successfully registered: "${elementName}"`);
      }
    } catch (error) {
      console.error(`[register components] Error registering component from ${path}:`, error);
    }
  });
}

// Auto-register all components when this module is loaded
registerAllComponents();