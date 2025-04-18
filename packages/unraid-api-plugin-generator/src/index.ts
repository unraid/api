#!/usr/bin/env node
import { Command } from 'commander';
import { createPlugin } from './create-plugin.js';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name('create-api-plugin')
  .description('Create a new Unraid API plugin')
  .argument('[name]', 'Name of the plugin (e.g., my-plugin)')
  .option('-d, --dir <directory>', 'Directory to create the plugin in', process.cwd())
  .option('-p, --package-manager <manager>', 'Package manager to use (npm, yarn, pnpm)', 'npm')
  .option('-i, --install', 'Install dependencies after creating the plugin', false)
  .action(async (name: string | undefined, options: { dir: string; packageManager: string; install: boolean }) => {
    try {
      let pluginName: string;
      if (!name || name.startsWith('-')) {
        console.log(chalk.yellow('No plugin name provided or invalid name detected. Please provide a name:'));
        const { pluginName: inputName } = await import('inquirer').then(({ default: inquirer }) => 
          inquirer.prompt([{
            type: 'input',
            name: 'pluginName',
            message: 'What would you like to name your plugin?',
            validate: (input: string) => {
              if (!input) return 'Plugin name is required';
              if (!/^[a-z0-9-]+$/.test(input)) return 'Plugin name can only contain lowercase letters, numbers, and hyphens';
              return true;
            }
          }])
        );
        pluginName = inputName;
      } else {
        pluginName = name;
      }

      const pluginDir = await createPlugin(pluginName, options.dir);
      console.log(chalk.green(`Successfully created plugin: ${pluginName}`));
      
      if (options.install) {
        console.log(chalk.blue(`\nInstalling dependencies using ${options.packageManager}...`));
        try {
          await execAsync(`${options.packageManager} install`, { cwd: pluginDir });
          console.log(chalk.green('Dependencies installed successfully!'));
        } catch (error) {
          console.error(chalk.red('Error installing dependencies:'), error);
          process.exit(1);
        }
      }

      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.blue(`1. cd ${pluginDir}`));
      if (!options.install) {
        console.log(chalk.blue(`2. ${options.packageManager} install`));
      }
      console.log(chalk.blue('3. Start developing your plugin!'));
    } catch (error) {
      console.error(chalk.red('Error creating plugin:'), error);
      process.exit(1);
    }
  });

program.parse(); 