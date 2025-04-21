#!/usr/bin/env node
import { Command } from "commander";
import { createPlugin, isValidName } from "./create-plugin.js";
import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const program = new Command();

async function getPluginName(name: string | undefined) {
  if (name && isValidName(name)) return name;
  const { pluginName } = await import("inquirer").then(
    ({ default: inquirer }) =>
      inquirer.prompt([
        {
          type: "input",
          name: "pluginName",
          message: "What would you like to name your plugin?",
          validate: (input: string) => {
            if (!input) return "Plugin name is required";
            if (!isValidName(input))
              return "Plugin name should only contain lowercase letters, numbers, and hyphens, and may not start with a hyphen";
            return true;
          },
        },
      ])
  );
  return pluginName;
}

program
  .name("create-api-plugin")
  .description("Create a new Unraid API plugin")
  .argument("[name]", "Name of the plugin (e.g., my-plugin)")
  .option(
    "-d, --dir <directory>",
    "Directory to create the plugin in",
    process.cwd()
  )
  .option(
    "-p, --package-manager <manager>",
    "Package manager to use (npm, yarn, pnpm)",
    "npm"
  )
  .option(
    "-i, --install",
    "Install dependencies after creating the plugin",
    false
  )
  .action(
    async (
      name: string | undefined,
      options: { dir: string; packageManager: string; install: boolean }
    ) => {
      try {
        const pluginName = await getPluginName(name);
        const pluginDir = await createPlugin(pluginName, options.dir);
        console.log(chalk.green(`Successfully created plugin: ${pluginName}`));

        if (options.install) {
          console.log(
            chalk.blue(
              `\nInstalling dependencies using ${options.packageManager}...`
            )
          );
          try {
            await execAsync(`${options.packageManager} install`, {
              cwd: pluginDir,
            });
            console.log(chalk.green("Dependencies installed successfully!"));
          } catch (error) {
            console.error(chalk.red("Error installing dependencies:"), error);
            process.exit(1);
          }
        }
        const nextSteps = [`cd ${pluginDir}`];
        if (!options.install) {
          nextSteps.push(`${options.packageManager} install`);
        }
        nextSteps.push(`Start developing your plugin!`);

        console.log(chalk.blue("\nNext steps:"));
        nextSteps.forEach((step, index) => {
          console.log(chalk.blue(`${index + 1}. ${step}`));
        });
      } catch (error) {
        console.error(chalk.red("Error creating plugin:"), error);
        process.exit(1);
      }
    }
  );

program.parse();
