import { Injectable, Logger } from '@nestjs/common';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { getters, store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { StateFileKey } from '@app/store/types.js';
import { Vars } from '@app/unraid-api/graph/resolvers/vars/vars.model.js';

@Injectable()
export class VarsService {
    private readonly logger = new Logger(VarsService.name);
    private readonly VERIFY_MAX_ATTEMPTS = 5;
    private readonly VERIFY_RETRY_MS = 1000;

    private isSshStateApplied(vars: Record<string, unknown>, enabled: boolean, port: number): boolean {
        const currentEnabled = Boolean(vars.useSsh);
        if (currentEnabled !== enabled) {
            return false;
        }

        if (!enabled) {
            return true;
        }

        const currentPort = Number(vars.portssh);
        return Number.isFinite(currentPort) && currentPort === port;
    }

    private async reloadVarsState(): Promise<Record<string, unknown>> {
        try {
            await store.dispatch(loadSingleStateFile(StateFileKey.var)).unwrap();
        } catch (error) {
            this.logger.debug('Failed to refresh var state during SSH verification', error as Error);
        }

        return (getters.emhttp().var ?? {}) as Record<string, unknown>;
    }

    private async waitForSshState(
        enabled: boolean,
        port: number
    ): Promise<{ verified: boolean; vars: Record<string, unknown> }> {
        let latestVars = (getters.emhttp().var ?? {}) as Record<string, unknown>;

        for (let attempt = 0; attempt < this.VERIFY_MAX_ATTEMPTS; attempt += 1) {
            const refreshedVars = await this.reloadVarsState();
            if (Object.keys(refreshedVars).length > 0) {
                latestVars = refreshedVars;
            }

            if (this.isSshStateApplied(refreshedVars, enabled, port)) {
                return {
                    verified: true,
                    vars: refreshedVars,
                };
            }

            if (attempt < this.VERIFY_MAX_ATTEMPTS - 1) {
                await sleep(this.VERIFY_RETRY_MS);
            }
        }

        return {
            verified: false,
            vars: latestVars,
        };
    }

    public async updateSshSettings(enabled: boolean, port: number): Promise<Vars> {
        this.logger.log(`Updating SSH settings: enabled=${enabled}, port=${port}`);

        const currentVars = getters.emhttp().var ?? {};

        // Helper to formatting values for emcmd (converting booleans to yes/no)
        const formatBool = (val: boolean | undefined | null) => (val ? 'yes' : 'no');
        const formatVal = (val: any) => (val !== undefined && val !== null ? String(val) : '');

        // Construct parameters based on ManagementAccess.page form fields
        // We preserve existing values for other fields to avoid overwriting them with defaults/empty
        const updateParams = {
            changePorts: 'Apply',
            server_name: 'localhost',
            server_addr: '127.0.0.1',
            // Use safe defaults for current values if store is not populated
            START_PAGE: formatVal(currentVars.startPage || 'Main'),
            USE_TELNET: formatBool(currentVars.useTelnet), // defaults to 'no' via formatBool(undefined)
            PORTTELNET: formatVal(currentVars.porttelnet || '23'),
            USE_SSH: formatBool(enabled), // New Value
            PORTSSH: formatVal(port), // New Value
            USE_UPNP: formatBool(currentVars.useUpnp), // defaults to 'no'
            USE_SSL: formatVal(currentVars.useSsl || 'no'),
            PORT: formatVal(currentVars.port || '80'),
            PORTSSL: formatVal(currentVars.portssl || '443'),
            LOCAL_TLD: formatVal(currentVars.localTld || 'local'),
        };

        this.logger.debug('Sending emcmd update params:', updateParams);

        try {
            // We disable token waiting because this operation restarts network services (SSH/SSHD),
            // which can cause the request to hang or fail if we wait for a token validation round-trip.
            const result = await emcmd(updateParams, { waitForToken: false });
            this.logger.log('SSH settings applied via emcmd', result.body);
        } catch (error: any) {
            this.logger.error('Failed to apply SSH settings via emcmd', error);
            if (error?.response) {
                this.logger.error('Response body:', error.response.body);
            }
            // We swallow errors here because restarting SSH/network services often causes
            // the connection or emcmd to fail/hang up even though the operation succeeded.
            // Returning the optimistic state allows the UI to proceed.
            this.logger.warn(
                'Error during emcmd execution (likely due to service restart), proceeding optimistically.'
            );
        }

        const { verified, vars } = await this.waitForSshState(enabled, port);
        if (verified) {
            this.logger.log('SSH settings verified after update.');
        } else {
            this.logger.warn(
                'SSH settings update submitted, but final state could not be verified yet.'
            );
        }

        const fallbackVars = {
            ...currentVars,
            useSsh: enabled,
            portssh: port,
        };

        const responseVars = Object.keys(vars).length > 0 ? vars : fallbackVars;

        return {
            id: 'vars',
            ...responseVars,
        } as unknown as Vars;
    }
}
