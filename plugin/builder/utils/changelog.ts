import { ConventionalChangelog } from "conventional-changelog";
import { execSync } from "child_process";

import { PluginEnv } from "../cli/setup-plugin-environment.js";

/**
 * Detects the base branch and finds the merge base for PR changelog generation
 * Returns the merge-base commit to only show commits from the current PR
 */
function getMergeBase(): string | null {
  try {
    // First, find the base branch
    let baseBranch: string | null = null;
    
    // Try to get the default branch from origin/HEAD
    try {
      const originHead = execSync("git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null", { 
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }).trim();
      if (originHead) {
        baseBranch = originHead.replace("refs/remotes/", "");
      }
    } catch {
      // origin/HEAD not set, continue to next strategy
    }

    // Try common default branch names if origin/HEAD didn't work
    if (!baseBranch) {
      const commonBranches = ["origin/main", "origin/master", "origin/develop"];
      for (const branch of commonBranches) {
        try {
          execSync(`git rev-parse --verify ${branch} 2>/dev/null`, { stdio: "ignore" });
          baseBranch = branch;
          break;
        } catch {
          // Branch doesn't exist, try next
        }
      }
    }

    if (!baseBranch) {
      return null;
    }

    // Find the merge-base between the current branch and the base branch
    // This gives us the commit where the PR branch diverged from main
    try {
      const mergeBase = execSync(`git merge-base ${baseBranch} HEAD`, { 
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }).trim();
      
      return mergeBase;
    } catch {
      // If merge-base fails, fall back to the base branch itself
      return baseBranch;
    }
  } catch {
    // Git command failed entirely, return null
    return null;
  }
}

/**
 * Generate a simple changelog for PR builds
 */
function generatePRChangelog(tag: string, mergeBase: string): string | null {
  try {
    // Get commits from this PR only with conventional commit parsing
    const commits = execSync(
      `git log ${mergeBase}..HEAD --pretty=format:"%s|%h" --reverse`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    ).trim();
    
    if (!commits) {
      return null;
    }

    const lines = commits.split('\n').filter(Boolean);
    const features: string[] = [];
    const fixes: string[] = [];
    const other: string[] = [];

    for (const line of lines) {
      const [message, hash] = line.split('|');
      const formatted = `* ${message} (${hash})`;
      
      if (message.startsWith('feat')) {
        features.push(formatted);
      } else if (message.startsWith('fix')) {
        fixes.push(formatted);
      } else {
        other.push(formatted);
      }
    }

    let changelog = `## [${tag}](https://github.com/unraid/api/${tag})\n\n`;
    
    if (features.length > 0) {
      changelog += `### Features\n\n${features.join('\n')}\n\n`;
    }
    if (fixes.length > 0) {
      changelog += `### Bug Fixes\n\n${fixes.join('\n')}\n\n`;
    }
    if (other.length > 0) {
      changelog += `### Other Changes\n\n${other.join('\n')}\n\n`;
    }

    return changelog;
  } catch {
    return null;
  }
}

export const getStagingChangelogFromGit = async ({
  pluginVersion,
  tag,
}: Pick<PluginEnv, "pluginVersion" | "tag">): Promise<string> => {
  try {
    // For PR builds with a tag, try to generate a simple PR-specific changelog
    if (tag) {
      const mergeBase = getMergeBase();
      if (mergeBase) {
        const prChangelog = generatePRChangelog(tag, mergeBase);
        if (prChangelog) {
          return prChangelog;
        }
      }
    }
    
    // Fall back to conventional-changelog for non-PR builds or if PR detection fails
    const options: any = {
      releaseCount: 1,
    };

    if (tag) {
      options.writerOpts = {
        headerPartial: `## [${tag}](https://github.com/unraid/api/${tag})\n\n`,
      };
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
    
    return changelog || "";
  } catch (err) {
    console.log('Non-fatal error: Failed to get changelog from git:', err);
    // Return a properly formatted fallback with markdown header
    if (tag) {
      return `## [${tag}](https://github.com/unraid/api/${tag})\n\n`;
    }
    return `## ${pluginVersion}\n\n`;
  }
};