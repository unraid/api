import { Injectable, Logger } from '@nestjs/common';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { getters } from '@app/store/index.js';
import { Vars } from '@app/unraid-api/graph/resolvers/vars/vars.model.js';

@Injectable()
export class VarsService {
    private readonly logger = new Logger(VarsService.name);

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

        // Return updated vars - construct expected state
        // Note: The store might take a moment to update via SSE, so we return optimistic values
        return {
            id: 'vars',
            ...currentVars,
            useSsh: enabled,
            portssh: port,
        } as unknown as Vars;
    }
}
