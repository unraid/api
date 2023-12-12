import { OAUTH_CLIENT_ID, OAUTH_OPENID_CONFIGURATION_URL } from '@app/consts';
import { mothershipLogger } from '@app/core';
import { getters, store } from '@app/store';
import { updateAccessTokens } from '@app/store/modules/config';
import { Cron, Expression, Initializer } from '@reflet/cron';
import { Issuer } from 'openid-client';

export class TokenRefresh extends Initializer<typeof TokenRefresh> {
    private issuer: Issuer | null = null;

    @Cron.PreventOverlap
    @Cron(Expression.EVERY_DAY_AT_NOON)
    @Cron.RunOnInit
    async getNewTokens() {
        const {
            remote: { refreshtoken },
        } = getters.config();

        if (!refreshtoken) {
            mothershipLogger.debug('No JWT refresh token configured');
            return;
        }

        if (!this.issuer) {
            try {
                this.issuer = await Issuer.discover(
                    OAUTH_OPENID_CONFIGURATION_URL
                );

                mothershipLogger.trace(
                    'Discovered Issuer %s',
                    this.issuer.issuer
                );
            } catch (error: unknown) {
                mothershipLogger.error({ error }, 'Failed to discover issuer');
                return;
            }
        }

        const client = new this.issuer.Client({
            client_id: OAUTH_CLIENT_ID,
            token_endpoint_auth_method: 'none',
        });

        const newTokens = await client.refresh(refreshtoken);
        mothershipLogger.debug('tokens %o', newTokens);
        if (newTokens.access_token && newTokens.id_token) {
            store.dispatch(
                updateAccessTokens({
                    accesstoken: newTokens.access_token,
                    idtoken: newTokens.id_token,
                })
            );
        }
    }
}
