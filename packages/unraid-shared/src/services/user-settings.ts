// Container for user-configurable settings (e.g in the Unraid GUI)

import { Injectable, Module } from "@nestjs/common";

import type { ApiConfig } from "./api-config.js";
import {
  mergeSettingSlices,
  type SettingSlice,
} from "../jsonforms/settings.js";

/**
 * A SettingsFragment represents a logical grouping (or "slice") of settings
 * exposed to users of the API. It's used to bundle the schema, view, and
 * control of a group of settings.
 */
export interface SettingsFragment<T> {
  buildSlice(): Promise<SettingSlice>;
  getCurrentValues(): Promise<T>;
  updateValues(
    values: Partial<T>
  ): Promise<{ restartRequired?: boolean; values: Partial<T> }>;
}

/**
 * A container type mapping setting names to the corresponding type of its settings values.
 *
 * This is used to provide type assistance via the @see UserSettingsService.
 *
 * Use interface merging to add new settings. Note that you must still call
 * @see UserSettingsService.register to register the settings. Otherwise, the type assistance will
 * be incorrect.
 *
 * Note that the UserSettings type is not used to store the actual SettingsFragment, just
 * the type of the settings values.
 */
export interface UserSettings {
  api: ApiConfig;
}

/** Wrap a type in a SettingsFragment. Ensure the type lives in the UserSettings interface. */
type FragmentOf<T extends keyof UserSettings = keyof UserSettings> =
  SettingsFragment<UserSettings[T]>;

/**
 * A service for controlling exposed settings.
 *
 * This allows plugins to expose settings to users of the API without having to
 * implement their own UI or api endpoints.
 */
@Injectable()
export class UserSettingsService {
  readonly settings = new Map<keyof UserSettings, FragmentOf>();

  constructor() {}
  register = this.settings.set;
  get = this.settings.get;

  getOrThrow<T extends keyof UserSettings>(
    name: T
  ): ReturnType<typeof this.get> {
    const fragment = this.get(name);
    if (!fragment) {
      throw new Error(`Setting '${name}' not registered (${typeof fragment}).`);
    }
    return fragment;
  }

  /** Get all settings as a single SettingSlice. */
  async getAllSettings(): Promise<SettingSlice> {
    const slicePromises = Array.from(this.settings.values()).map((fragment) =>
      fragment.buildSlice()
    );
    const slices = await Promise.all(slicePromises);
    return mergeSettingSlices(slices);
  }
}

@Module({
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
