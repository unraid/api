import { ChoicesFor, Question, QuestionSet } from 'nest-commander';

import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

export class NoPluginsFoundError extends Error {
    constructor() {
        super('No plugins found to remove');
        this.name = 'NoPluginsFoundError';
    }
}

@QuestionSet({ name: 'remove-plugin' })
export class RemovePluginQuestionSet {
    static name = 'remove-plugin';

    @Question({
        message: `Please select plugins to remove:\n`,
        name: 'plugins',
        type: 'checkbox',
    })
    parsePlugins(val: string[]) {
        return val;
    }

    @ChoicesFor({ name: 'plugins' })
    async choicesForPlugins() {
        const installedPlugins = await PluginService.listPlugins();

        if (installedPlugins.length === 0) {
            throw new NoPluginsFoundError();
        }

        return installedPlugins.map(([name, version]) => ({
            name: `${name}@${version}`,
            value: name,
        }));
    }
}
