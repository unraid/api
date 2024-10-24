import { execSync } from 'child_process';

const runCommand = (command) => {
    try {
        return execSync(command, { stdio: 'pipe' }).toString().trim();
    } catch (error) {
        console.log('Failed to get value from tag command: ', command, error.message);
        return;
    }
};

export const getDeploymentVersion = (env = process.env, packageVersion) => {
    if (env.API_VERSION) {
        console.log(`Using env var for version: ${env.API_VERSION}`);
        return env.API_VERSION;
    } else if (env.GIT_SHA && env.IS_TAGGED) {
        console.log(`Using env vars for git tags: ${env.GIT_SHA} ${env.IS_TAGGED}`);
        return env.IS_TAGGED ? packageVersion : `${packageVersion}+${env.GIT_SHA}`;
    } else {
        const gitShortSHA = runCommand('git rev-parse --short HEAD');
        const isCommitTagged = runCommand('git describe --tags --abbrev=0 --exact-match') !== undefined;
        console.log('gitShortSHA', gitShortSHA, 'isCommitTagged', isCommitTagged);
        if (!gitShortSHA) {
            console.error('Failed to get git short SHA');
            process.exit(1);
        }
        return isCommitTagged ? packageVersion : `${packageVersion}+${gitShaShort}`;
    }
};
