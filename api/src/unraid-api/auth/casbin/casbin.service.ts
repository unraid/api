import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';

import { Model as CasbinModel, Enforcer, newEnforcer, StringAdapter } from 'casbin';

import { LOG_LEVEL } from '@app/environment.js';

@Injectable()
export class CasbinService {
    private readonly logger = new Logger(CasbinService.name);
    private enforcer: Enforcer | null = null;

    /**
     * Initializes a Casbin enforcer with the given model and policies.
     */
    async initializeEnforcer(model: string, policy: string) {
        this.logger.log('Initializing Casbin enforcer');

        const casbinModel = new CasbinModel();
        casbinModel.loadModelFromText(model);
        const casbinPolicy = new StringAdapter(policy);
        try {
            const enforcer = await newEnforcer(casbinModel, casbinPolicy);
            if (LOG_LEVEL === 'TRACE') {
                enforcer.enableLog(true);
            }

            return enforcer;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to create Casbin enforcer: ${errorMessage}`);

            throw new InternalServerErrorException(`Failed to create Casbin enforcer: ${errorMessage}`);
        }
    }
}
