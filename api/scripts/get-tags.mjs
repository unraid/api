import { execSync } from 'child_process';

const runCommand = (command) => {
    try {
        return execSync(command, { stdio: 'pipe' }).toString().trim();
    } catch(error) {
        console.log('Failed to get value from tag command: ', command, error.message);
        return;
    }
};

const getTags = (env = process.env) => {

    if (env.GIT_SHA) {
        console.log(`Using env vars for git tags: ${env.GIT_SHA} ${env.IS_TAGGED}`)
        return {
            shortSha: env.GIT_SHA,
            isTagged: Boolean(env.IS_TAGGED)
        }
    } else {
        const gitShortSHA = runCommand('git rev-parse --short HEAD');
        const isCommitTagged = runCommand('git describe --tags --abbrev=0 --exact-match') !== undefined;
        console.log('gitShortSHA', gitShortSHA, 'isCommitTagged', isCommitTagged);
        if (!gitShortSHA) {
            console.error('Failed to get git short SHA');
            process.exit(1);
        }
        return {
            shortSha: gitShortSHA,
            isTagged: isCommitTagged
        }
    }
}

export default getTags;