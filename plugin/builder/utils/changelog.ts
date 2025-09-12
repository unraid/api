import { ConventionalChangelog } from "conventional-changelog";

import { PluginEnv } from "../cli/setup-plugin-environment";

export const getStagingChangelogFromGit = async ({
  pluginVersion,
  tag,
}: Pick<PluginEnv, "pluginVersion" | "tag">): Promise<string> => {
  try {
    const generator = new ConventionalChangelog()
      .loadPreset("conventionalcommits")
      .context({
        version: tag || pluginVersion,
        ...(tag && {
          linkCompare: false,
        }),
      })
      .options({
        releaseCount: tag ? 0 : 1,
        ...(tag && {
          writerOpts: {
            headerPartial: `## [${tag}](https://github.com/unraid/api/${tag})\n\n`,
          },
          gitRawCommitsOpts: {
            from: "origin/main",
            to: "HEAD",
          },
        }),
      });

    let changelog = "";
    for await (const chunk of generator.write()) {
      changelog += chunk;
    }
    // Encode HTML entities using the 'he' library
    return changelog ?? "";
  } catch (err) {
    console.log('Non-fatal error: Failed to get changelog from git:', err);
    return tag;
  }
};
