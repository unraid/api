import type { Config } from "tailwindcss";
import { scaleRemFactor } from "../utils";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

export default plugin.withOptions(
  () => {
    return function () {
      // Plugin functionality can be added here if needed in the future
    };
  },
  (options?: {
    baseFontSize?: number;
    newFontSize?: number;
  }): Partial<Config> => {
    const baseFontSize = options?.baseFontSize ?? 16;
    const newFontSize = options?.newFontSize ?? 10;

    return {
      theme: scaleRemFactor(
        defaultTheme,
        baseFontSize,
        newFontSize
      ) as Config["theme"],
    };
  }
);
