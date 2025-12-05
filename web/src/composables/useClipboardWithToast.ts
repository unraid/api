import { useClipboard } from '@vueuse/core';

/**
 * Composable for clipboard operations with toast notifications
 */
export function useClipboardWithToast() {
  const { copy, copied, isSupported } = useClipboard();
  const toast = useToast();

  /**
   * Copy text and show toast
   * @param text - The text to copy
   * @param successMessage - Optional custom success message
   */
  const copyWithNotification = async (
    text: string,
    successMessage: string = 'Copied to clipboard'
  ): Promise<boolean> => {
    // Try modern Clipboard API first
    if (isSupported.value) {
      try {
        await copy(text);
        toast.add({ title: successMessage, color: 'success' });
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }

    // Fallback to execCommand for HTTP contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        toast.add({ title: successMessage, color: 'success' });
        return true;
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
    }

    // Both methods failed
    toast.add({ title: 'Failed to copy to clipboard', color: 'error' });
    return false;
  };

  return {
    copyWithNotification,
    copied,
    isSupported,
  };
}
