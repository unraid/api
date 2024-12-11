import type { XCircleIcon } from "@heroicons/vue/24/solid";
import type { Component } from "vue";

export type UiBadgePropsColor =
  | "alpha"
  | "beta"
  | "gamma"
  | "gray"
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "orange"
  | "black"
  | "white"
  | "transparent"
  | "current"
  | "custom";

export interface UiBadgeProps {
  color?: UiBadgePropsColor;
  icon?: typeof XCircleIcon | Component;
  iconRight?: typeof XCircleIcon | Component;
  iconStyles?: string;
  size?: "12px" | "14px" | "16px" | "18px" | "20px" | "24px";
}
