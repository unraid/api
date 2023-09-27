import type { Component } from 'vue';

export interface RegistrationItemProps {
  component?: Component;
  componentProps?: object;
  componentOpacity?: boolean;
  error?: boolean;
  label?: string;
  text?: number | string;
}