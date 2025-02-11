import { execa } from 'execa';

const runCommand = async (command: string, args: string[]) => {
    try {
        const { stdout } = await execa(command, args);
        return stdout.trim();
    } catch (error) {
        console.log('Failed to execute command:', command, args.join(' '), error.message);
        return undefined;
    }
};

export const getDeploymentVersion = async (env = process.env, packageVersion: string) => {
    if (env.API_VERSION) {
        console.log(`Using env var for version: ${env.API_VERSION}`);
        return env.API_VERSION;
    } else if (env.GIT_SHA && env.IS_TAGGED) {
        console.log(`Using env vars for git tags: ${env.GIT_SHA} ${env.IS_TAGGED}`);
        return env.IS_TAGGED ? packageVersion : `${packageVersion}+${env.GIT_SHA}`;
    } else {
        const gitShortSHA = await runCommand('git', ['rev-parse', '--short', 'HEAD']);
        const isCommitTagged = await runCommand('git', ['describe', '--tags', '--abbrev=0', '--exact-match']) !== undefined;
        
        console.log('gitShortSHA', gitShortSHA, 'isCommitTagged', isCommitTagged);
        
        if (!gitShortSHA) {
            console.error('Failed to get git short SHA');
            process.exit(1);
        }
        return isCommitTagged ? packageVersion : `${packageVersion}+${gitShortSHA}`;
    }
};
