import { getCurrentInstance, inject } from 'vue';
import type Gettext from 'node-gettext';

// Define more specific types for interpolation values
type InterpolationValue = string | number | boolean | null | undefined;
type InterpolationArray = InterpolationValue[];
type InterpolationObject = Record<string, InterpolationValue>;

/**
 * Helper function to replace placeholders in a string
 * Supports both {0}, {1}, etc placeholders and named placeholders like {name}
 */
function interpolate(message: string, values?: InterpolationObject | InterpolationArray): string {
  if (!values) return message;
  
  let result = message;
  
  if (Array.isArray(values)) {
    // Handle array values ([val1, val2, ...]) - used with {0}, {1}, etc.
    values.forEach((val, idx) => {
      const placeholder = `{${idx}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(val ?? ''));
    });
  } else {
    // Handle object values ({key1: val1, key2: val2, ...}) - used with {key1}, {key2}, etc.
    Object.entries(values).forEach(([key, val]) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(val ?? ''));
    });
  }
  
  return result;
}

/**
 * Composable to provide gettext-style translation functions
 * This lets you use gettext functions in your components with a cleaner API
 */
export function useI18n() {
  const instance = getCurrentInstance();
  
  // Try to inject the gettext instance first
  const gettext = inject<Gettext>('gettext');
  // Logging for debugging injection issues
   
  console.log('[useI18n] injected gettext:', gettext);
  
  // If component instance is available, use the global functions
  if (instance) {
    const { $gettext, $ngettext, $pgettext } = instance.appContext.config.globalProperties;
    
    return {
      // Simple gettext
      $gettext: (text: string) => $gettext(text),
      
      // Enhanced gettext with interpolation
      $t: (text: string, values?: InterpolationObject | InterpolationArray) => {
        const translated = $gettext(text);
        return interpolate(translated, values);
      },
      
      // Original functions
      $ngettext,
      $pgettext
    };
  }
  
  // If we have the gettext instance injected, use it directly
  if (gettext) {
     
    console.log('[useI18n] typeof gettext.gettext:', typeof gettext.gettext);
    if (typeof gettext.gettext !== 'function') {
      throw new Error('[useI18n] Injected gettext does not have a gettext() function.');
    }
    return {
      $gettext: (text: string) => gettext.gettext(text),
      
      $t: (text: string, values?: InterpolationObject | InterpolationArray) => {
        const translated = gettext.gettext(text);
        return interpolate(translated, values);
      },
      
      $ngettext: (singular: string, plural: string, count: number) => 
        gettext.ngettext(singular, plural, count),
      $pgettext: (context: string, text: string) => 
        gettext.pgettext(context, text)
    };
  }
  
  // Fallback implementation with identity functions
  console.warn('Gettext instance not found, translations will not work');
  return {
    $gettext: (text: string) => text,
    
    $t: (text: string, values?: InterpolationObject | InterpolationArray) => {
      return interpolate(text, values);
    },
    
    $ngettext: (singular: string, plural: string, count: number) => 
      count === 1 ? singular : plural,
    $pgettext: (_context: string, text: string) => text
  };
} 