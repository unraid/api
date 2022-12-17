import { graphql } from '@app/graphql/generated/client/gql';

export const GET_SERVERS_FROM_MOTHERSHIP = graphql(/* GraphQL */`
query queryServersFromMothership($apiKey: String!) {
	servers @auth(apiKey: $apiKey) {
		owner {
			username
			url
			avatar
		}
		guid
		apikey
		name
		status
		wanip
		lanip
		localurl
		remoteurl
	}
}

`);
