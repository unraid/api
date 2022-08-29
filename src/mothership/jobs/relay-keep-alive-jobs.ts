/* eslint-disable new-cap */

import { relayLogger } from '@app/core/log';
import { Cron, CurrentJob, Expression, Initializer, Job } from '@reflet/cron';
import { sendMessage } from '@app/mothership/send-message';
import { relayStore } from '@app/mothership/store';

export class RelayKeepAlive extends Initializer<typeof RelayKeepAlive> {
	@Cron.Start()
	@Cron.PreventOverlap
	@Cron(Expression.EVERY_30_SECONDS)
	async sendKeepAlive(@CurrentJob runningKeepAliveJob: Job) {
		try {
			if (!relayStore.relay?.isOpened) {
				runningKeepAliveJob.stop();
				return;
			}

			relayLogger.trace('Sending keep alive message for Relay');
			await sendMessage('ka', 'ka');
		} catch (error: unknown) {
			relayLogger.error('Failed sending keepalive message with error %s.', error);
		}
	}
}

