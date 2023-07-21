export const preventClose = (e: { preventDefault: () => void; returnValue: string; }) => {
  e.preventDefault();
  e.returnValue = '';
  alert('Closing this pop-up window while actions are being preformed may lead to unintended errors.');
};

export const addPreventClose = () => {
  window.addEventListener('beforeunload', preventClose);
};

export const removePreventClose = () => {
  window.removeEventListener('beforeunload', preventClose);
};
