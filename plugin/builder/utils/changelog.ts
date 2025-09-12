import { ConventionalChangelog } from "conventional-changelog";
import { execSync } from "child_process";

import { PluginEnv } from "../cli/setup-plugin-environment.js";

/**
 * Detects the base branch for changelog generation
 * Tries multiple strategies to find a valid base reference
 */
function detectBaseBranch(): string | null {
  try {
    // Try to get the default branch from origin/HEAD
    try {
      const originHead = execSync("git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null", { 
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }).trim();
      if (originHead) {
        // Extract branch name from refs/remotes/origin/main format
        const branch = originHead.replace("refs/remotes/", "");
        // Verify the ref exists
        execSync(`git rev-parse --verify ${branch} 2>/dev/null`, { stdio: "ignore" });
        return branch;
      }
    } catch {
      // origin/HEAD not set, continue to next strategy
    }

    // Try common default branch names
    const commonBranches = ["origin/main", "origin/master", "origin/develop"];
    for (const branch of commonBranches) {
      try {
        execSync(`git rev-parse --verify ${branch} 2>/dev/null`, { stdio: "ignore" });
        return branch;
      } catch {
        // Branch doesn't exist, try next
      }
    }

    // If no remote branches found, return null to use default behavior
    return null;
  } catch {
    // Git command failed entirely, return null
    return null;
  }
}

export const getStagingChangelogFromGit = async ({
  pluginVersion,
  tag,
}: Pick<PluginEnv, "pluginVersion" | "tag">): Promise<string> => {
  try {
    // Detect base branch for comparison
    const baseBranch = tag ? detectBaseBranch() : null;
    
    const options: any = {
      releaseCount: tag ? 0 : 1,
    };

    if (tag) {
      options.writerOpts = {
        headerPartial: `## [${tag}](https://github.com/unraid/api/${tag})\n\n`,
      };
      
      // Only set gitRawCommitsOpts if we found a valid base branch
      if (baseBranch) {
        options.gitRawCommitsOpts = {
          from: baseBranch,
          to: "HEAD",
        };
      }
      // If no base branch found, conventional-changelog will use its default behavior
    }

    const generator = new ConventionalChangelog()
      .loadPreset("conventionalcommits")
      .context({
        version: tag || pluginVersion,
        ...(tag && {
          linkCompare: false,
        }),
      })
      .options(options);

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
