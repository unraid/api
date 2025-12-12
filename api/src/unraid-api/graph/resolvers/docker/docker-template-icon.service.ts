import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class DockerTemplateIconService {
    private readonly logger = new Logger(DockerTemplateIconService.name);
    private readonly xmlParser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
        trimValues: true,
    });

    async getIconFromTemplate(templatePath: string): Promise<string | null> {
        try {
            const content = await readFile(templatePath, 'utf-8');
            const parsed = this.xmlParser.parse(content);

            if (!parsed.Container) {
                return null;
            }

            return parsed.Container.Icon || null;
        } catch (error) {
            this.logger.debug(
                `Failed to read icon from template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return null;
        }
    }

    async getIconsForContainers(
        containers: Array<{ id: string; templatePath?: string }>
    ): Promise<Map<string, string>> {
        const iconMap = new Map<string, string>();

        const iconPromises = containers.map(async (container) => {
            if (!container.templatePath) {
                return null;
            }

            const icon = await this.getIconFromTemplate(container.templatePath);
            if (icon) {
                return { id: container.id, icon };
            }
            return null;
        });

        const results = await Promise.all(iconPromises);

        for (const result of results) {
            if (result) {
                iconMap.set(result.id, result.icon);
            }
        }

        this.logger.debug(`Loaded ${iconMap.size} icons from ${containers.length} containers`);
        return iconMap;
    }
}
