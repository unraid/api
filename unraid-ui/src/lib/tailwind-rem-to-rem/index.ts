import { scaleRemFactor } from "../utils";

import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

export default plugin.withOptions(
  () => {
    return function () {
      // Plugin functionality can be added here if needed in the future
    };
  },
  // @ts-expect-error Invalid index signature
  (options: { baseFontSize?: number; newFontSize?: number }) => {
    const baseFontSize = options?.baseFontSize ?? 16;
    const newFontSize = options?.newFontSize ?? 10;

    return {
      theme: scaleRemFactor(defaultTheme, baseFontSize, newFontSize),
    };
  }
);
