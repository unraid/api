import { onMounted, onUnmounted } from 'vue';

type ShortcutHandler = () => void;
type Shortcuts = Record<string, ShortcutHandler>;

export function defineShortcuts(shortcuts: Shortcuts) {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Build key combination string
    const keys: string[] = [];
    if (event.metaKey || event.ctrlKey) keys.push('meta');
    if (event.altKey) keys.push('alt');
    if (event.shiftKey) keys.push('shift');
    
    // Add the actual key
    const key = event.key.toLowerCase();
    if (key !== 'meta' && key !== 'control' && key !== 'alt' && key !== 'shift') {
      keys.push(key);
    }
    
    const combination = keys.join('_');
    
    // Check if we have a handler for this combination
    if (shortcuts[combination]) {
      event.preventDefault();
      shortcuts[combination]();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
}
