import Button from '@app/components/common/button/Button.vue';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(Button, {
      slots: {
        default: 'Click me',
      },
    });

    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('renders with different variants', () => {
    const { rerender } = render(Button, {
      props: { variant: 'destructive' },
      slots: { default: 'Delete' },
    });

    rerender({
      props: { variant: 'outline' },
      slots: { default: 'Delete' },
    });
  });

  it('renders with different sizes', () => {
    const { rerender } = render(Button, {
      props: { size: 'sm' },
      slots: { default: 'Small Button' },
    });

    rerender({
      props: { size: 'lg' },
      slots: { default: 'Large Button' },
    });
  });

  it('accepts and applies additional classes', () => {
    render(Button, {
      props: {
        class: 'custom-class',
      },
      slots: {
        default: 'Custom Button',
      },
    });

    const button = screen.getByRole('button');

    expect(button.classList.contains('custom-class')).toBe(true);
  });
});
