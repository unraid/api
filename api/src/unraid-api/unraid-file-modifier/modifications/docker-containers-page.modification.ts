import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class DockerContainersPageModification extends FileModification {
    id: string = 'docker-containers-page';
    public readonly filePath: string =
        '/usr/local/emhttp/plugins/dynamix.docker.manager/DockerContainers.page';

    async shouldApply(): Promise<ShouldApplyWithReason> {
        const baseCheck = await super.shouldApply();
        if (!baseCheck.shouldApply) {
            return baseCheck;
        }

        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.3.0')) {
            return {
                shouldApply: false,
                reason: 'Docker overview table is integrated in Unraid 7.3 or later',
            };
        }

        return {
            shouldApply: true,
            reason: 'Docker overview table modification needed for Unraid < 7.3',
        };
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');
        const newContent = this.applyToSource();

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }

    private applyToSource(): string {
        return `Menu="Docker:1"
Title="Docker Containers"
Tag="cubes"
Cond="is_file('/var/run/dockerd.pid')"
Markdown="false"
Nchan="docker_load"
Tabs="false"
---
<div class="unapi">
  <unraid-docker-container-overview></unraid-docker-container-overview>
</div>
`;
    }
}
