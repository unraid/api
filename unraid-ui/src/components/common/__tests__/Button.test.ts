/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import type { mount as _mount } from "@vue/test-utils";
import { mount } from "@vue/test-utils";
import Button from "../button/Button.vue";

describe("Button", () => {
  it("renders correctly", () => {
    const wrapper = mount(Button, {
      slots: {
        default: "Click me",
      },
    });

    expect(wrapper.text()).toBe("Click me");
  });

  it("applies variant classes", () => {
    const wrapper = mount(Button, {
      props: {
        variant: "destructive",
      },
    });

    expect(wrapper.classes()).toContain("bg-destructive");
  });

  it("applies size classes", () => {
    const wrapper = mount(Button, {
      props: {
        size: "sm",
      },
    });

    expect(wrapper.classes()).toContain("h-8");
  });
});
