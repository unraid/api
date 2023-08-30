import { type Resolvers } from '@app/graphql/generated/api/types';
import { sendNotification } from './notifications';
import { connectSignIn } from '@app/graphql/resolvers/mutation/connect/connect-sign-in';
import { connectSignOut } from '@app/graphql/resolvers/mutation/connect/connect-sign-out';

export const Mutation: Resolvers['Mutation'] = {
	sendNotification,
	connectSignIn,
	connectSignOut
};
