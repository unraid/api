/**
 * @see https://www.telerik.com/blogs/how-to-trap-focus-modal-vue-3
 */
import { customRef } from "vue";
import { createFocusTrap } from "focus-trap";

const useFocusTrap = focusTrapArgs => {
  const trapRef = customRef((track, trigger) => {
    let $trapEl = null;
    return {
      get() {
        track();
        return $trapEl;
      },
      set(value) {
        $trapEl = value;
        value ? initFocusTrap(focusTrapArgs) : clearFocusTrap();
        trigger();
      },
    };
  });

  let trap = null;
  const initFocusTrap = focusTrapArgs => {
    if (!trapRef.value) return;
    trap = createFocusTrap(trapRef.value, focusTrapArgs);
    trap.activate();
  };

  const clearFocusTrap = () => {
    trap?.deactivate();
    trap = null;
  };

  return {
    trapRef,
    initFocusTrap,
    clearFocusTrap,
  };
};

export default useFocusTrap;
