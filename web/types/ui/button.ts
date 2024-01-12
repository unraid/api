export interface ButtonProps {
  btnStyle?: 'black' | 'fill' | 'gray' | 'outline' | 'outline-black' | 'outline-white' | 'underline' | 'underline-hover-red' | 'white';
  btnType?: 'button' | 'submit' | 'reset';
  click?: () => void;
  disabled?: boolean;
  download?: boolean;
  external?: boolean;
  href?: string;
  icon?: Component;
  iconRight?: Component;
  iconRightHoverDisplay?: boolean;
  // iconRightHoverAnimate?: boolean;
  size?: '12px' | '14px' | '16px' | '18px' | '20px' | '24px';
  text?: string;
  title?: string;
}
