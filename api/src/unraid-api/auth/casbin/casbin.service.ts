import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { Model as CasbinModel, newEnforcer, StringAdapter } from 'casbin';

@Injectable()
export class CasbinService {
    private readonly logger = new Logger(CasbinService.name);

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
            enforcer.enableLog(true);

            return enforcer;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to create Casbin enforcer: ${errorMessage}`);

            throw new InternalServerErrorException(`Failed to create Casbin enforcer: ${errorMessage}`);
        }
    }
}
