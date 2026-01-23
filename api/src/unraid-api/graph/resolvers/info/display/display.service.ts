import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import * as ini from 'ini';

import { type DynamixConfig } from '@app/core/types/ini.js';
import { toBoolean } from '@app/core/utils/casting.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { loadState } from '@app/core/utils/misc/load-state.js';
import { validateEnumValue } from '@app/core/utils/validation/enum-validator.js';
import { loadDynamixConfigFromDiskSync } from '@app/store/actions/load-dynamix-config-file.js';
import { getters, store } from '@app/store/index.js';
import { updateDynamixConfig } from '@app/store/modules/dynamix.js';
import { ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import { Display, Temperature } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';

const states = {
    // Success
    custom: {
        id: 'display/case',
        url: '',
        icon: 'custom',
        error: '',
        base64: '',
    },
    default: {
        id: 'display/case',
        url: '',
        icon: 'default',
        error: '',
        base64: '',
    },

    // Errors
    couldNotReadConfigFile: {
        id: 'display/case',
        url: '',
        icon: 'custom',
        error: 'could-not-read-config-file',
        base64: '',
    },
    couldNotReadImage: {
        id: 'display/case',
        url: '',
        icon: 'custom',
        error: 'could-not-read-image',
        base64: '',
    },
    imageMissing: {
        id: 'display/case',
        url: '',
        icon: 'custom',
        error: 'image-missing',
        base64: '',
    },
    imageTooBig: {
        id: 'display/case',
        url: '',
        icon: 'custom',
        error: 'image-too-big',
        base64: '',
    },
    imageCorrupt: {
        id: 'display/case',
        url: '',
        icon: 'custom',
        error: 'image-corrupt',
        base64: '',
    },
};

@Injectable()
export class DisplayService {
    private readonly logger = new Logger(DisplayService.name);

    async generateDisplay(): Promise<Display> {
        // Get case information
        const caseInfo = await this.getCaseInfo();

        // Get display configuration
        const config = await this.getDisplayConfig();

        const display: Display = {
            id: 'info/display',
            case: caseInfo,
            theme: config.theme ?? ThemeName.white,
            unit: config.unit ?? Temperature.CELSIUS,
            scale: config.scale ?? false,
            tabs: config.tabs ?? true,
            resize: config.resize ?? true,
            wwn: config.wwn ?? false,
            total: config.total ?? true,
            usage: config.usage ?? true,
            text: config.text ?? true,
            warning: config.warning ?? 60,
            critical: config.critical ?? 80,
            hot: config.hot ?? 90,
            max: config.max,
            locale: config.locale,
        };

        return display;
    }

    async setLocale(locale: string): Promise<Display> {
        this.logger.log(`Updating locale to ${locale}`);
        const paths = getters.paths();
        const configFile = paths['dynamix-config']?.[1];

        if (!configFile) {
            throw new Error('Dynamix config path not found');
        }

        await this.updateCfgFile(configFile, 'display', { locale });

        // Refresh in-memory store
        const updatedConfig = loadDynamixConfigFromDiskSync(paths['dynamix-config']);
        store.dispatch(updateDynamixConfig(updatedConfig));

        return this.generateDisplay();
    }

    private async updateCfgFile(
        filePath: string,
        section: string | null,
        updates: Record<string, string>
    ) {
        let configData: Record<string, Record<string, string> | string> = {};
        try {
            const content = await readFile(filePath, 'utf-8');
            configData = ini.parse(content) as Record<string, Record<string, string> | string>;
        } catch (error: unknown) {
            // If creation is needed, we handle it. But typically dynamix.cfg exists.
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                this.logger.log(`Config file ${filePath} not found, will create it.`);
            } else {
                this.logger.error(`Error reading config file ${filePath}:`, error);
                throw error;
            }
        }

        if (section) {
            if (!configData[section] || typeof configData[section] === 'string') {
                configData[section] = {};
            }
            Object.entries(updates).forEach(([key, value]) => {
                (configData[section] as Record<string, string>)[key] = value;
            });
        } else {
            Object.entries(updates).forEach(([key, value]) => {
                configData[key] = value;
            });
        }

        try {
            const newContent = ini.stringify(configData);
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, newContent + '\n');
            this.logger.log(`Config file ${filePath} updated successfully.`);
        } catch (error: unknown) {
            this.logger.error(`Error writing config file ${filePath}:`, error);
            throw error;
        }
    }

    private async getCaseInfo() {
        const dynamixBasePath = getters.paths()['dynamix-base'];
        const configFilePath = join(dynamixBasePath, 'case-model.cfg');

        // If the config file doesn't exist then it's a new OS install
        // Default to "default"
        if (!(await fileExists(configFilePath))) {
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
            id: 'display/case',
            icon: serverCase,
        };
    }

    private async getDisplayConfig(): Promise<Partial<Omit<Display, 'id' | 'case'>>> {
        const filePaths = getters.paths()['dynamix-config'];

        const state = filePaths.reduce<Partial<DynamixConfig>>((acc, filePath) => {
            const state = loadState<DynamixConfig>(filePath);
            if (state) {
                Object.assign(acc, state);
            }
            return acc;
        }, {});

        if (!state.display) {
            return {};
        }

        const { theme, unit, ...display } = state.display;

        return {
            ...display,
            theme: validateEnumValue(theme, ThemeName),
            unit: validateEnumValue(unit, Temperature),
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
