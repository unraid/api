import { type Resolvers } from '@app/graphql/generated/api/types';
import { sendNotification } from './notifications';

export const Mutation: Resolvers['Mutation'] = {
	sendNotification,
};
