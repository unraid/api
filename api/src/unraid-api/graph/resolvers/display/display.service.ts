import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { type DynamixConfig } from '@app/core/types/ini.js';
import { toBoolean } from '@app/core/utils/casting.js';
import { loadState } from '@app/core/utils/misc/load-state.js';
import { getters } from '@app/store/index.js';
import { ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import { Display, Temperature } from '@app/unraid-api/graph/resolvers/info/info.model.js';

const states = {
    // Success
    custom: {
        url: '',
        icon: 'custom',
        error: '',
        base64: '',
    },
    default: {
        url: '',
        icon: 'default',
        error: '',
        base64: '',
    },

    // Errors
    couldNotReadConfigFile: {
        url: '',
        icon: 'custom',
        error: 'could-not-read-config-file',
        base64: '',
    },
    couldNotReadImage: {
        url: '',
        icon: 'custom',
        error: 'could-not-read-image',
        base64: '',
    },
    imageMissing: {
        url: '',
        icon: 'custom',
        error: 'image-missing',
        base64: '',
    },
    imageTooBig: {
        url: '',
        icon: 'custom',
        error: 'image-too-big',
        base64: '',
    },
    imageCorrupt: {
        url: '',
        icon: 'custom',
        error: 'image-corrupt',
        base64: '',
    },
};

@Injectable()
export class DisplayService {
    async generateDisplay(): Promise<Display> {
        // Get case information
        const caseInfo = await this.getCaseInfo();

        // Get display configuration
        const config = await this.getDisplayConfig();

        return {
            id: 'display',
            case: caseInfo,
            ...config,
        };
    }

    private async getCaseInfo() {
        const dynamixBasePath = getters.paths()['dynamix-base'];
        const configFilePath = join(dynamixBasePath, 'case-model.cfg');

        // If the config file doesn't exist then it's a new OS install
        // Default to "default"
        if (!existsSync(configFilePath)) {
            return states.default;
        }

        // Attempt to get case from file
        const serverCase = await readFile(configFilePath)
            .then((buffer) => buffer.toString().split('\n')[0])
            .catch(() => 'error_reading_config_file');

        // Config file can't be read, maybe a permissions issue?
        if (serverCase === 'error_reading_config_file') {
            return states.couldNotReadConfigFile;
        }

        // Blank cfg file?
        if (serverCase.trim().length === 0) {
            return states.default;
        }

        // Non-custom icon
        return {
            ...states.default,
            icon: serverCase,
        };
    }

    private async getDisplayConfig() {
        const filePaths = getters.paths()['dynamix-config'];

        const state = filePaths.reduce<Partial<DynamixConfig>>((acc, filePath) => {
            const state = loadState<DynamixConfig>(filePath);
            return state ? { ...acc, ...state } : acc;
        }, {});

        if (!state.display) {
            return {};
        }

        const { theme, unit, ...display } = state.display;
        return {
            ...display,
            theme: theme as ThemeName,
            unit: unit as Temperature,
            scale: toBoolean(display.scale),
            tabs: toBoolean(display.tabs),
            resize: toBoolean(display.resize),
            wwn: toBoolean(display.wwn),
            total: toBoolean(display.total),
            usage: toBoolean(display.usage),
            text: toBoolean(display.text),
            warning: Number.parseInt(display.warning, 10),
            critical: Number.parseInt(display.critical, 10),
            hot: Number.parseInt(display.hot, 10),
            max: Number.parseInt(display.max, 10),
            locale: display.locale || 'en_US',
        };
    }
}
