import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type RemToPxInput = unknown;

function isFunction(
  input: RemToPxInput
): input is (...args: unknown[]) => boolean {
  return typeof input === "function";
}

export function scaleRemFactor(
  input: RemToPxInput,
  baseFontSize = 16,
  newFontSize = 10
): unknown {
  const scaleFactor = baseFontSize / newFontSize; // baseFontSize / newFontSize;
  if (input == null) return input;

  if (typeof input === "string") {
    return input.replace(
      /(\d*\.?\d+)rem$/,
      (_, val) => `${(parseFloat(val) * scaleFactor).toFixed(4)}rem`
    );
  }

  if (Array.isArray(input))
    return input.map((val) => scaleRemFactor(val, baseFontSize, newFontSize));

  if (typeof input === "object") {
    const ret: Record<string, RemToPxInput> = {};
    const obj = input as Record<string, RemToPxInput>;
    for (const key in obj) {
      ret[key] = scaleRemFactor(obj[key], baseFontSize, newFontSize);
    }
    return ret;
  }

  if (isFunction(input)) {
    return function (...args: unknown[]): unknown {
      const replacedArgs = args.map((arg) => {
        if (typeof arg === "string") {
          return arg.replace(
            /(\d*\.?\d+)rem/g,
            (_, val) => `${(parseFloat(val) * scaleFactor).toFixed(4)}rem`
          );
        }
        return arg;
      });
      return input(...replacedArgs);
    };
  }

  return input;
}
