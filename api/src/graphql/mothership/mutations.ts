import { graphql } from '@app/graphql/generated/client/gql';

export const SEND_DASHBOARD_PAYLOAD_MUTATION = graphql(/* GraphQL */`
mutation updateDashboard($data: DashboardInput!, $apiKey: String!) {
	updateDashboard(data: $data) @auth(apiKey: $apiKey) {
		apps {
			installed
		}
	}
}`,
);

export const SEND_NOTIFICATION_MUTATION = graphql(/* GraphQL */ `
mutation sendNotification($notification:NotificationInput!, $apiKey: String!) {
	sendNotification(notification: $notification) @auth(apiKey: $apiKey)
	{
		title 
		subject 
		description
		importance
		link
		status
	}
}`);

export const SEND_NETWORK_MUTATION = graphql(/* GraphQL */ `
mutation updateNetwork($data: NetworkInput!, $apiKey: String!) {
	updateNetwork(data: $data) @auth(apiKey: $apiKey) {
		accessUrls {
			name
			type
			ipv4
			ipv6
		}
	}
}
`);

// This doesn't need auth directive, new mothership can handle clients with no auth directives
export const SEND_DYNAMIC_REMOTE_ACCESS_ACK_MUTATION = graphql(/* GraphQL */ `
mutation sendRemoteAccessMutation($remoteAccess: RemoteAccessInput!) {
	remoteSession(remoteAccess: $remoteAccess)
}
`);
