declare module 'nchan' {

	interface SubscriberOptions {
		subscriber: 'eventsource';
	}

	export class NchanSubscriber {
		constructor(endpoint: string, options: SubscriberOptions);

		on: (event: string, event: (...params) => void) => void;
		start: () => void;
		stop: () => void;
		reconnect: boolean;
	}

	export = NchanSubscriber;
}
