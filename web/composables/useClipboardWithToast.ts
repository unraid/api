import { useClipboard } from '@vueuse/core';
import { useToast } from '@unraid/ui';

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
    if (!isSupported.value) {
      console.warn('Clipboard API is not supported');
      toast.error('Clipboard not supported');
      return false;
    }
    
    try {
      await copy(text);
      toast.success(successMessage);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
      return false;
    }
  };
  
  return {
    copyWithNotification,
    copied,
    isSupported,
  };
}
