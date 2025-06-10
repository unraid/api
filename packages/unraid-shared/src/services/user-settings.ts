// Container for user-configurable settings (e.g in the Unraid GUI)

import { Injectable, Module } from "@nestjs/common";

import type { ApiConfig } from "./api-config.js";
import {
  mergeSettingSlices,
  type SettingSlice,
} from "../jsonforms/settings.js";
import { getPrefixedSortedKeys } from "../util/key-order.js";

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
 * This is used to provide type assistance via the {@see UserSettingsService}.
 *
 * Use interface merging to add new settings. Note that you must still call
 * {@see UserSettingsService.register} to register the settings. Otherwise, the type assistance will
 * be incorrect.
 *
 * ! Note that the following characters may not be used in setting names:
 * - `/`, `~` - will cause issues in JSON schema references (during dynamic form & schema generation)
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

  register<T extends keyof UserSettings>(name: T, fragment: FragmentOf<T>) {
    this.settings.set(name, fragment);
  }

  get<T extends keyof UserSettings>(name: T): FragmentOf<T> | undefined {
    return this.settings.get(name);
  }

  getOrThrow<T extends keyof UserSettings>(
    name: T
  ): NonNullable<ReturnType<typeof this.get>> {
    const fragment = this.get(name);
    if (!fragment) {
      throw new Error(`Setting '${name}' not registered (${typeof fragment}).`);
    }
    return fragment;
  }

  /**
   * Get all settings as a single SettingSlice.
   *
   * Optionally accepts an ordered list of setting keys.  Slices belonging to these keys
   * will be placed at the beginning of the merged slice, in the order provided.  Any
   * remaining registered settings will be appended afterwards, ordered alphabetically
   * by key.  This ensures a deterministic result while still allowing the caller to
   * prioritise first-party settings.
   */
  async getAllSettings(
    orderedKeys: (keyof UserSettings)[] = []
  ): Promise<SettingSlice> {
    // Build final key order using helper
    const finalOrder = getPrefixedSortedKeys(
      this.settings,
      orderedKeys as (keyof UserSettings)[]
    );

    const slicePromises = finalOrder.map((key: keyof UserSettings) =>
      this.settings.get(key)!.buildSlice()
    );
    const slices = await Promise.all(slicePromises);
    return mergeSettingSlices(slices);
  }

  /** Get all current values from all registered settings fragments. */
  async getAllValues(): Promise<Record<string, any>> {
    const entriesPromises = Array.from(this.settings.entries()).map(
      async ([key, fragment]) => {
        const values = await fragment.getCurrentValues();
        return [key, values] as const;
      }
    );

    const entries = await Promise.all(entriesPromises);
    return Object.fromEntries(entries);
  }

  /** Update values for a specific settings fragment. */
  async updateValues<T extends keyof UserSettings>(
    name: T,
    values: Partial<UserSettings[T]>
  ): Promise<{ restartRequired?: boolean; values: Partial<UserSettings[T]> }> {
    const fragment = this.getOrThrow(name);
    return fragment.updateValues(values);
  }

  /** Update values from a namespaced object. */
  async updateNamespacedValues(
    values: Record<string, any>
  ): Promise<{ restartRequired?: boolean; values: Record<string, any> }> {
    let restartRequired = false;

    for (const [key, fragmentValues] of Object.entries(values)) {
      if (!this.settings.has(key as keyof UserSettings)) {
        // Skip unknown namespaces – they may belong to other consumers
        continue;
      }

      const result = await this.updateValues(
        key as keyof UserSettings,
        fragmentValues
      );
      if (result.restartRequired) {
        restartRequired = true;
      }
    }

    return { restartRequired, values: await this.getAllValues() };
  }
}

@Module({
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
