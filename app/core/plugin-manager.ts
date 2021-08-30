/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'node:fs';
import path from 'node:path';
import pIteration from 'p-iteration';
import glob from 'glob';
import { validate as validateArgument } from 'bycontract';
import deepMerge from 'deepmerge';
import { PackageJson } from 'type-fest';
import * as core from '.';
import { coreLogger } from './log';
import { paths } from './paths';
import { AppError } from './errors';

interface PluginModule {
	/** The module's absolute file path. */
	readonly filePath: string;
	/** If the plugin is currently active. */
	readonly isActive: boolean;
}

type PluginModuleWithName = PluginModule & {
	readonly name: string;
};

export interface Plugin {
	/** If the plugin is currently active. */
	readonly isActive: boolean;
	/** Modules belonging to the plugin. */
	readonly modules: Readonly<PluginModuleWithName[] | PluginModule[]>;
	/** If the plugin is currently disabled. */
	readonly disabled?: string;
}

interface SetActiveStateOptions {
	readonly plugin: Readonly<Plugin>;
	readonly pluginName: string;
	readonly moduleName: string;
	readonly active: boolean;
}

/**
 * Set a module to active/inactive.
 *
 * @param plugins All the registered plugins.
 * @param plugin The plugin being modified.
 * @param pluginName The name plugin to set active.
 * @param moduleName The module name.
 * @param activeState If the module/plugin should be set to active or inactive.
 */
const setActiveState = (
	plugins: Readonly<Map<string, Readonly<Plugin>>>,
	options: Readonly<SetActiveStateOptions>
): void => {
	const { plugin, pluginName, moduleName, active } = options;
	validateArgument(active, 'boolean');

	// If we have a module let's set both the plugin and module
	if (moduleName) {
		validateArgument(moduleName, 'string');

		const object = deepMerge(plugin, {
			isActive: active,
			modules: {
				[moduleName]: {
					isActive: active
				}
			}
		});
		plugins.set(pluginName, object);
		return;
	}

	// Otherwise set the module as in/active
	{
		const object = deepMerge(plugin, {
			isActive: active,
			// If activeState = in-active set all modules as in-active too
			modules: (active ? {} : Object.fromEntries(Object.keys(plugin.modules).map(moduleName => {
				return [moduleName, {
					isActive: active
				}];
			})))
		});
		plugins.set(pluginName, object);
	}
};

/**
 * Plugin manager
 *
 * @name PluginManager
 * @class
 * @global
 * @property {Map} plugins
 */
export class PluginManager {
	constructor(private readonly plugins: Map<Readonly<string>, Readonly<Plugin>> = new Map()) {}

	/**
	 * Get plugin info
	 *
	 * @param {string} pluginName Name of the plugin.
	 * @param {string} moduleName Name of the module.
	 * @memberof PluginManager
	 */
	get(pluginName: string): Plugin | void;
	get(pluginName: string, moduleName?: string): PluginModule | void;
	get(pluginName: string, moduleName?: string): unknown {
		const plugin = this.plugins.get(pluginName);

		// If it's missing modules it's likely disabled
		if (!plugin || !plugin.modules) {
			return;
		}

		if (!moduleName) {
			return plugin;
		}

		if (!Object.keys(plugin.modules).includes(moduleName)) {
			return;
		}

		return (plugin.modules[moduleName] as PluginModule);
	}

	/**
	 * Run a plugin's init file
	 *
	 * @param pluginPath Absolute or relative(based on `path.get('plugins')`) path to the plugin's root directory.
	 * @async
	 * @memberof PluginManager
	 */
	async init(pluginPath: string): Promise<void> {
		const isNamespaced = pluginPath.startsWith('@') && pluginPath.includes('/');
		const isAbsolute = pluginPath.startsWith('/');
		const absoluteName = pluginPath.slice(pluginPath.lastIndexOf('/') + 1);
		const relativeName = isNamespaced ? pluginPath.split('@')[1].split('/')[1] : pluginPath;
		const pluginName = isAbsolute ? absoluteName : relativeName;
		const pluginCwd = isAbsolute ? pluginPath.slice(0, pluginPath.lastIndexOf('/')) : paths.get('plugins')!;
		const pluginDirectory = path.join(pluginCwd, pluginName);
		const pluginPackagePath = path.join(pluginDirectory, 'package.json');
		const pluginHasPackage = fs.existsSync(pluginPackagePath);

		// Ensure we have a package.json for the plugin
		if (!pluginHasPackage) {
			throw new AppError(`Plugin "${pluginName}" is missing it’s "package.json".`);
		}

		// Get the plugin's package.json
		const pluginPackage: PackageJson = await import(pluginPackagePath);
		if (!pluginPackage.main) {
			throw new AppError(`Plugin "${pluginName}" is missing it’s "main" field in the "package.json".`);
		}

		// Skip any plugins without a main file
		const packageMainPath = path.join(pluginDirectory, pluginPackage.main);
		if (!pluginPackage.main) {
			coreLogger.error('Plugin "%s" has no main field in it’s package.json', pluginName);
			return;
		}

		if (!fs.existsSync(packageMainPath)) {
			coreLogger.error('Plugin "%s" is missing it’s main file "%s"', pluginName, packageMainPath);
			return;
		}

		// Create context
		const context = {
			params: {}
		};

		// Resolve plugin's main
		let plugin;
		try {
			coreLogger.debug('Plugin "%s" loading main file.', pluginName);
			plugin = await import(packageMainPath);
		} catch (error: unknown) {
			coreLogger.error('Plugin "%s" failed to load: %s', pluginName, error);

			// Disable plugin as it failed to load it's init file
			this.disable(pluginName);
			return;
		}

		// Initialize plugin
		await Promise.resolve(plugin.init(context, core)).then(async () => {
			coreLogger.debug('Plugin "%s" loaded successfully.', pluginName);

			// Add to manager
			this.add(pluginName);

			// Register all modules
			const modulesDirectory = path.join(pluginDirectory, 'modules');
			const modulesGlob = path.join(modulesDirectory, '/**/*.js');
			for (const filePath of glob.sync(modulesGlob)) {
				const moduleName = filePath.replace(modulesDirectory + '/', '').replace('.js', '');
				this.add(pluginName, moduleName, filePath);
			}
		}).catch(error => {
			coreLogger.error('Plugin "%s" failed to run it’s init function: %s', pluginName, error);

			// Disable plugin as it failed to run it's init file
			this.disable(pluginName);
		});
	}

	/**
	 * Add a plugin to the {@link PluginManager | plugin manager}.
	 *
	 * @param pluginName Name of the plugin.
	 * @param moduleName Name of the module.
	 * @param moduleFilePath Path to the module's root directory.
	 * @param disabled If the plugin is disabled from core.
	 * @memberof PluginManager
	 */
	add(pluginName: string, moduleName?: string, moduleFilePath?: string, disabled = false): void {
		// Get existing plugin so we don't override all opts
		const plugin = this.plugins.get(pluginName)!;

		// If we have a module let's set both the plugin and module
		if (moduleName) {
			coreLogger.debug('Plugin Manager: Adding module [%s]', moduleName);
			const object = deepMerge(plugin, {
				isActive: true,
				disabled,
				modules: {
					[moduleName]: {
						filePath: moduleFilePath,
						isActive: true
					}
				}
			});
			this.plugins.set(pluginName, object);
			return;
		}

		// Otherwise just set the module
		coreLogger.debug('Plugin Manager: Adding plugin [%s]', pluginName);
		const object = deepMerge(plugin, {
			isActive: true,
			disabled,
			modules: {}
		});
		this.plugins.set(pluginName, object);
	}

	/**
	 * Disable plugin and modules.
	 *
	 * @param pluginName Name of the plugin.
	 * @memberof PluginManager
	 */
	disable(pluginName: string): void {
		coreLogger.debug('Plugin Manager: Disabling plugin [%s]', pluginName);
		const plugin = this.plugins.get(pluginName)!;
		const object = deepMerge(plugin, {
			disabled: true
		});

		this.plugins.set(pluginName, object);
	}

	/**
	 * Set plugin and/or module as active.
	 *
	 * @param pluginName Name of the plugin.
	 * @param moduleName Name of the module.
	 * @memberof PluginManager
	 */
	setActive(pluginName: string, moduleName: string): void {
		const plugin = this.plugins.get(pluginName);

		if (!plugin) {
			throw new AppError(`Plugin ${pluginName} not found.`);
		}

		setActiveState(this.plugins, {
			plugin,
			pluginName,
			moduleName,
			active: true
		});
	}

	/**
	 * Deactivate a plugin.
	 *
	 * @param pluginName Name of the plugin.
	 * @param moduleName Name of the module.
	 */
	setInActive(pluginName: string, moduleName: string): void {
		const plugin = this.plugins.get(pluginName);

		if (!plugin) {
			throw new AppError(`Plugin ${pluginName} not found.`);
		}

		setActiveState(this.plugins, {
			plugin,
			pluginName,
			moduleName,
			active: false
		});
	}

	/**
	 * Check if plugin and/or module as active.
	 *
	 * @param pluginName Name of the plugin.
	 * @param moduleName Name of the module.
	 * @returns If the plugin is active or not.
	 * @memberof PluginManager
	 */
	isActive(pluginName: string, moduleName: string): boolean {
		const plugin = this.plugins.get(pluginName);

		// If it's missing modules it's likely disabled
		if (!plugin || !plugin.modules || plugin.disabled) {
			return false;
		}

		if (moduleName) {
			if (Object.keys(plugin.modules).includes(moduleName)) {
				return (plugin.modules[moduleName] as PluginModule).isActive;
			}

			return false;
		}

		return plugin.isActive;
	}

	/**
	 * Check if plugin is installed.
	 *
	 * @param pluginName Name of the plugin.
	 * @param moduleName Name of the module.
	 * @returns `true` if the plugin is installed, otherwise `false`.
	 */
	isInstalled(pluginName: string, moduleName: string): boolean {
		validateArgument(pluginName, 'string');

		const plugin = this.plugins.get(pluginName);

		if (!plugin) {
			return false;
		}

		if (moduleName) {
			validateArgument(moduleName, 'string');

			return Object.keys(plugin.modules).includes(moduleName);
		}

		return true;
	}

	/**
	 * Get all plugins.
	 *
	 * @returns Names of all the currently registered plugins.
	 */
	getAllPlugins(): Plugin[] {
		const keys = [...this.plugins.keys()];
		return keys.map(name => {
			const plugin = this.plugins.get(name)!;

			return {
				name,
				...plugin
			};
		});
	}

	/**
	 * Get active plugins.
	 *
	 * @returns All the active plugins.
	 */
	getActivePlugins(): Plugin[] {
		return this.getAllPlugins().filter(plugin => plugin.isActive);
	}

	/**
	 * Remove all plugins from manager.
	 *
	 * @memberof PluginManager
	 */
	reset(): void {
		this.plugins.clear();
	}
}

export const pluginManager = new PluginManager();
