import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/vue";
import Button from "./Button.vue";

describe("Button", () => {
  it("renders correctly with default props", () => {
    render(Button, {
      slots: {
        default: "Click me",
      },
    });

    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("renders with different variants", () => {
    const { rerender } = render(Button, {
      props: {
        variant: "destructive",
      },
      slots: {
        default: "Delete",
      },
    });

    let button = screen.getByRole("button");

    rerender({
      props: {
        variant: "outline",
      },
      slots: {
        default: "Delete",
      },
    });
    button = screen.getByRole("button");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(Button, {
      props: {
        size: "sm",
      },
      slots: {
        default: "Small Button",
      },
    });

    let button = screen.getByRole("button");

    rerender({
      props: {
        size: "lg",
      },
      slots: {
        default: "Small Button",
      },
    });
    button = screen.getByRole("button");
  });

  it("accepts and applies additional classes", () => {
    render(Button, {
      props: {
        class: "custom-class",
      },
      slots: {
        default: "Custom Button",
      },
    });

    const button = screen.getByRole("button");

    expect(button.classList.contains("custom-class")).toBe(true);
  });
});
