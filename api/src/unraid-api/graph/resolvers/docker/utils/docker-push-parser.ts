export interface DockerPushMatch {
    name: string;
    updateStatus: number;
}

export function parseDockerPushCalls(jsCode: string): DockerPushMatch[] {
    const dockerPushRegex = /docker\.push\(\{[^}]*(?:(?:[^{}]|{[^}]*})*)\}\);/g;
    const matches: DockerPushMatch[] = [];

    for (const match of jsCode.matchAll(dockerPushRegex)) {
        const objectContent = match[0];

        const nameMatch = objectContent.match(/name\s*:\s*'([^']+)'/);
        const updateMatch = objectContent.match(/update\s*:\s*(\d)/);

        if (nameMatch && updateMatch) {
            const name = nameMatch[1];
            const updateStatus = Number(updateMatch[1]);
            matches.push({ name, updateStatus });
        }
    }

    return matches;
}
