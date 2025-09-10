import { ref, shallowRef } from 'vue';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const isOpen = ref(false);
const state = shallowRef<ConfirmState | null>(null);

export function useConfirm() {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      state.value = {
        ...options,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        confirmVariant: options.confirmVariant ?? 'default',
        resolve,
      };
      isOpen.value = true;
    });
  };

  const handleConfirm = () => {
    state.value?.resolve(true);
    isOpen.value = false;
    state.value = null;
  };

  const handleCancel = () => {
    state.value?.resolve(false);
    isOpen.value = false;
    state.value = null;
  };

  return {
    confirm,
    isOpen,
    state,
    handleConfirm,
    handleCancel,
  };
}
