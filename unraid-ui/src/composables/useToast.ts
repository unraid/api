import { toast as sonnerToast } from 'vue-sonner';

/**
 * Composable for toast notifications using vue-sonner
 * Provides a consistent API for showing toast messages
 */
export function useToast() {
  /**
   * Show a default toast notification
   * @param message - The message to display
   */
  const toast = (message: string) => {
    sonnerToast(message);
  };

  /**
   * Show a success toast
   * @param message - The success message to display
   */
  const success = (message: string) => {
    sonnerToast.success(message);
  };

  /**
   * Show an error toast
   * @param message - The error message to display
   */
  const error = (message: string) => {
    sonnerToast.error(message);
  };

  /**
   * Show a warning toast
   * @param message - The warning message to display
   */
  const warning = (message: string) => {
    sonnerToast.warning(message);
  };

  /**
   * Show an info toast
   * @param message - The info message to display
   */
  const info = (message: string) => {
    sonnerToast.info(message);
  };

  /**
   * Show a loading toast
   * @param message - The loading message to display
   */
  const loading = (message: string) => {
    sonnerToast.loading(message);
  };

  /**
   * Show a promise-based toast that updates based on promise state
   * @param promise - The promise to track
   * @param messages - Messages for different states
   * @returns The toast ID with an unwrap method to get the original promise
   */
  const promise = <T>(
    promiseToHandle: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    // Return vue-sonner's promise return type which includes the toast ID and unwrap method
    return sonnerToast.promise(promiseToHandle, messages);
  };

  /**
   * Dismiss a specific toast or all toasts
   * @param toastId - Optional toast ID to dismiss. If not provided, dismisses all toasts
   */
  const dismiss = (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  };

  return {
    // Allow calling the composable directly as toast()
    toast,
    // Named methods
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    // Also expose the raw sonner toast for advanced usage
    sonner: sonnerToast,
  };
}

// Export type for the return value
export type ToastInstance = ReturnType<typeof useToast>;
