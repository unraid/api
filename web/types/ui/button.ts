export type ButtonStyle = 'black' | 'fill' | 'gray' | 'outline' | 'outline-black' | 'outline-white' | 'underline' | 'underline-hover-red' | 'white' | 'none';
export interface ButtonProps {
  btnStyle?: ButtonStyle;
  btnType?: 'button' | 'submit' | 'reset';
  class?: string;
  click?: () => void;
  disabled?: boolean;
  download?: boolean;
  external?: boolean;
  href?: string;
  icon?: Component;
  iconRight?: Component;
  iconRightHoverDisplay?: boolean;
  // iconRightHoverAnimate?: boolean;
  noPadding?: boolean;
  size?: '12px' | '14px' | '16px' | '18px' | '20px' | '24px';
  text?: string;
  title?: string;
}
