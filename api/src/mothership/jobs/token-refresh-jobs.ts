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
		const { remote: { refreshtoken } } = getters.config();

		if (!refreshtoken) {
			mothershipLogger.debug('No JWT refresh token configured');
			return;
		}

		if (!this.issuer) {
			try {
				this.issuer = await Issuer.discover(OAUTH_OPENID_CONFIGURATION_URL);
				mothershipLogger.addContext('issuer_meta', this.issuer.metadata);
				mothershipLogger.trace('Discovered Issuer %s', this.issuer.issuer);
				mothershipLogger.removeContext('issuer_meta');
			} catch (error: unknown) {
				mothershipLogger.addContext('error', error);
				mothershipLogger.error('Failed to discover issuer');
				mothershipLogger.removeContext('error');
				return;
			}
		}

		const client = new this.issuer.Client({
			client_id: OAUTH_CLIENT_ID,
			token_endpoint_auth_method: 'none',
		});

		const newTokens = await client.refresh(refreshtoken);
		this.expiresAt = newTokens.expires_at;
		mothershipLogger.debug('tokens %o', newTokens);
		if (newTokens.access_token && newTokens.id_token) {
			store.dispatch(updateAccessTokens({ accesstoken: newTokens.access_token, idtoken: newTokens.id_token }));
		}
	}
}
