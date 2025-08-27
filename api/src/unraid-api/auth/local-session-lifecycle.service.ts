import { Injectable, OnModuleInit } from '@nestjs/common';

import { LocalSessionService } from '@app/unraid-api/auth/local-session.service.js';

/**
 * Service for managing the lifecycle of the local session.
 *
 * Used for tying the local session's lifecycle to the API's life, rather
 * than the LocalSessionService's lifecycle, since it may also be used by
 * other applications, like the CLI.
 *
 * This service is only used in the API, and not in the CLI.
 */
@Injectable()
export class LocalSessionLifecycleService implements OnModuleInit {
    constructor(private readonly localSessionService: LocalSessionService) {}

    async onModuleInit() {
        await this.localSessionService.generateLocalSession();
    }
}
