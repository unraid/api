import type { Plugin } from 'vite';

/**
 * Vite plugin to prefix all CSS classes with a unique identifier
 * This allows us to exclude our components from webgui styles
 */
export function prefixClasses(prefix = 'unapi'): Plugin {
  return {
    name: 'vite-plugin-prefix-classes',
    
    // Transform CSS files
    transform(code, id) {
      // Only process CSS files and Vue SFC styles
      if (!id.match(/\.(css|scss|sass|less|styl|stylus|postcss)$/) && !id.includes('?vue&type=style')) {
        return null;
      }
      
      // Skip node_modules
      if (id.includes('node_modules')) {
        return null;
      }
      
      // Prefix class selectors in CSS
      const prefixedCss = code.replace(
        /\.([a-zA-Z_][\w-]*)/g,
        (match, className) => {
          // Skip if already prefixed
          if (className.startsWith(prefix)) {
            return match;
          }
          // Skip Tailwind internals and special classes
          if (className.startsWith('__') || className.startsWith('group-') || className.startsWith('peer-')) {
            return match;
          }
          return `.${prefix}-${className}`;
        }
      );
      
      return {
        code: prefixedCss,
        map: null
      };
    },
    
    // Transform HTML/templates in Vue files
    async transform(code, id) {
      // Only process Vue files
      if (!id.endsWith('.vue')) {
        return null;
      }
      
      // Prefix classes in template
      const prefixedCode = code.replace(
        /class="([^"]*)"/g,
        (match, classes) => {
          const prefixedClasses = classes
            .split(/\s+/)
            .filter(Boolean)
            .map(cls => {
              // Skip if already prefixed or is a binding
              if (cls.startsWith(prefix) || cls.includes(':') || cls.includes('[') || cls.includes('{')) {
                return cls;
              }
              return `${prefix}-${cls}`;
            })
            .join(' ');
          return `class="${prefixedClasses}"`;
        }
      );
      
      // Also handle :class bindings with static strings
      const finalCode = prefixedCode.replace(
        /:class="'([^']+)'"/g,
        (match, classes) => {
          const prefixedClasses = classes
            .split(/\s+/)
            .filter(Boolean)
            .map(cls => {
              if (cls.startsWith(prefix)) {
                return cls;
              }
              return `${prefix}-${cls}`;
            })
            .join(' ');
          return `:class="'${prefixedClasses}'"`;
        }
      );
      
      return {
        code: finalCode,
        map: null
      };
    }
  };
}
