import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { XMLParser } from 'fast-xml-parser';
import * as ini from 'ini';

import { type DynamixConfig } from '@app/core/types/ini.js';
import { toBoolean } from '@app/core/utils/casting.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer.js';
import { loadState } from '@app/core/utils/misc/load-state.js';
import { validateEnumValue } from '@app/core/utils/validation/enum-validator.js';
import { loadDynamixConfigFromDiskSync } from '@app/store/actions/load-dynamix-config-file.js';
import { getters, store } from '@app/store/index.js';
import { updateDynamixConfig } from '@app/store/modules/dynamix.js';
import { ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import {
    Display,
    Language,
    Temperature,
} from '@app/unraid-api/graph/resolvers/info/display/display.model.js';

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
    private readonly localePattern = /^[a-z]{2}_[A-Z]{2}$/;
    private readonly xmlParser = new XMLParser({
        ignoreAttributes: false,
        trimValues: true,
    });

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
        const normalizedLocale = this.validateLocale(locale);
        this.logger.log(`Updating locale to ${normalizedLocale}`);
        const paths = getters.paths();
        const configFile = paths['dynamix-config']?.[1];

        if (!configFile) {
            throw new Error('Dynamix config path not found');
        }

        await this.updateCfgFile(configFile, 'display', { locale: normalizedLocale });

        // Refresh in-memory store
        const updatedConfig = loadDynamixConfigFromDiskSync(paths['dynamix-config']);
        store.dispatch(updateDynamixConfig(updatedConfig));

        return this.generateDisplay();
    }

    async setTheme(theme: string): Promise<Display> {
        const normalizedTheme = this.validateTheme(theme);
        this.logger.log(`Updating theme to ${normalizedTheme}`);
        const paths = getters.paths();
        const configFile = paths['dynamix-config']?.[1];

        if (!configFile) {
            throw new Error('Dynamix config path not found');
        }

        await this.updateCfgFile(configFile, 'display', { theme: normalizedTheme });

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
            const hasTopLevelScalarValues = Object.values(configData).some(
                (value) => value === null || typeof value !== 'object' || Array.isArray(value)
            );
            const newContent = hasTopLevelScalarValues
                ? ini.stringify(configData)
                : safelySerializeObjectToIni(configData);
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, newContent + '\n');
            this.logger.log(`Config file ${filePath} updated successfully.`);
        } catch (error: unknown) {
            this.logger.error(`Error writing config file ${filePath}:`, error);
            throw error;
        }
    }

    private validateLocale(locale: string): string {
        const normalizedLocale = locale.trim();
        if (!this.localePattern.test(normalizedLocale)) {
            throw new Error(`Invalid locale "${locale}". Expected format ll_CC (example: en_US).`);
        }
        return normalizedLocale;
    }

    private validateTheme(theme: string): ThemeName {
        const normalizedTheme = theme.trim() as ThemeName;
        if (!Object.values(ThemeName).includes(normalizedTheme)) {
            throw new Error(`Invalid theme "${theme}".`);
        }
        return normalizedTheme;
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

    async getAvailableLanguages(): Promise<Language[]> {
        try {
            const response = await fetch('https://assets.ca.unraid.net/feed/languageSelection.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch languages: ${response.statusText}`);
            }
            const data = (await response.json()) as Record<string, { Desc?: string; URL?: string }>;

            const languages = await Promise.all(
                Object.entries(data).map(async ([code, info]) => {
                    const nameFromXml = info.URL
                        ? await this.getLanguageNameFromXml(info.URL)
                        : undefined;

                    return {
                        code,
                        name: nameFromXml ?? info.Desc?.trim() ?? code,
                        url: info.URL,
                    };
                })
            );

            return languages.sort((left, right) =>
                left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
            );
        } catch (error) {
            this.logger.error('Failed to fetch available languages', error);
            // Return empty list or basic English fallback on error
            return [{ code: 'en_US', name: 'English' }];
        }
    }

    private async getLanguageNameFromXml(url: string): Promise<string | undefined> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch language XML: ${response.status} ${response.statusText}`
                );
            }

            const xml = await response.text();
            const parsed = this.xmlParser.parse(xml) as { Language?: { Language?: string } };
            const xmlLanguageName = parsed.Language?.Language?.trim();

            return xmlLanguageName || undefined;
        } catch (error) {
            this.logger.debug(
                `Failed to parse language XML (${url}); falling back to feed description: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return undefined;
        }
    }
}
