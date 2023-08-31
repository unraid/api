const runCommand = (command) => {
    try {
        return execSync(command, { stdio: 'pipe' }).toString().trim();
    } catch {
        return;
    }
};

const getTags = () => {
    const GIT_SHA_ENV = process.env.GIT_SHA
    const IS_TAGGED_ENV = Boolean(process.env.IS_TAGGED);
    if (GIT_SHA_ENV && IS_TAGGED_ENV) {
        return {
            shortSha: GIT_SHA_ENV,
            isTagged: IS_TAGGED_ENV
        }
    } else {
        const gitShortSHA = runCommand('git rev-parse --short HEAD');
        const isCommitTagged = runCommand('git describe --tags --abbrev=0 --exact-match') !== undefined;

        return {
            shortSha: gitShortSHA,
            isTagged: isCommitTagged
        }
    }
}

export default getTags;