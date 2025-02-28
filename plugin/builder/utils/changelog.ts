import conventionalChangelog from "conventional-changelog";

import { PluginEnv } from "../cli/setup-plugin-environment";

export const getStagingChangelogFromGit = async ({
  tag,
}: Pick<PluginEnv, "tag">): Promise<string> => {
  try {
    const changelogStream = conventionalChangelog(
      {
        preset: "conventionalcommits",
      },
      {
        version: tag,
      },
      tag
        ? {
            from: "origin/main",
            to: "HEAD",
          }
        : {},
      undefined,
      tag
        ? {
            headerPartial: `## [${tag}](https://github.com/unraid/api/${tag})\n\n`,
          }
        : undefined
    );
    let changelog = "";
    for await (const chunk of changelogStream) {
      changelog += chunk;
    }
    // Encode HTML entities using the 'he' library
    return changelog ?? "";
  } catch (err) {
    console.error(`Error: failed to get changelog from git: ${err}`);
    process.exit(1);
  }
};
