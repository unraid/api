import { Injectable } from '@nestjs/common';

import { type UISchemaElement } from '@jsonforms/core';

import { DockerContainerOverviewForm } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DataSlice } from '@app/unraid-api/types/json-forms.js';

@Injectable()
export class DockerFormService {
    constructor(private readonly dockerService: DockerService) {}

    async getContainerOverviewForm(skipCache = false): Promise<DockerContainerOverviewForm> {
        const containers = await this.dockerService.getContainers({ skipCache });

        // Transform containers data for table display
        const tableData = containers.map((container) => ({
            id: container.id,
            name: container.names[0]?.replace(/^\//, '') || 'Unknown',
            state: container.state,
            status: container.status,
            image: container.image,
            ports: container.ports
                .map((p) => {
                    if (p.publicPort && p.privatePort) {
                        return `${p.publicPort}:${p.privatePort}/${p.type}`;
                    } else if (p.privatePort) {
                        return `${p.privatePort}/${p.type}`;
                    }
                    return '';
                })
                .filter(Boolean)
                .join(', '),
            autoStart: container.autoStart,
            network: container.hostConfig?.networkMode || 'default',
        }));

        const dataSchema = this.createDataSchema();
        const uiSchema = this.createUiSchema();

        return {
            id: 'docker-container-overview',
            dataSchema: {
                type: 'object',
                properties: dataSchema,
            },
            uiSchema,
            data: {
                containers: tableData,
            },
        };
    }

    private createDataSchema(): DataSlice {
        return {
            containers: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            title: 'ID',
                        },
                        name: {
                            type: 'string',
                            title: 'Name',
                        },
                        state: {
                            type: 'string',
                            title: 'State',
                            enum: ['RUNNING', 'EXITED'],
                        },
                        status: {
                            type: 'string',
                            title: 'Status',
                        },
                        image: {
                            type: 'string',
                            title: 'Image',
                        },
                        ports: {
                            type: 'string',
                            title: 'Ports',
                        },
                        autoStart: {
                            type: 'boolean',
                            title: 'Auto Start',
                        },
                        network: {
                            type: 'string',
                            title: 'Network',
                        },
                    },
                },
            },
        };
    }

    private createUiSchema(): UISchemaElement {
        return {
            type: 'VerticalLayout',
            elements: [
                {
                    type: 'Control',
                    scope: '#/properties/containers',
                    options: {
                        detail: {
                            type: 'HorizontalLayout',
                            elements: [
                                {
                                    type: 'Control',
                                    scope: '#/properties/name',
                                    options: {
                                        trim: true,
                                        readonly: true,
                                    },
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/state',
                                    options: {
                                        readonly: true,
                                        format: 'badge',
                                    },
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/status',
                                    options: {
                                        readonly: true,
                                    },
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/image',
                                    options: {
                                        readonly: true,
                                        trim: true,
                                    },
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/ports',
                                    options: {
                                        readonly: true,
                                    },
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/autoStart',
                                    options: {
                                        readonly: true,
                                    },
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/network',
                                    options: {
                                        readonly: true,
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        };
    }
}
