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
