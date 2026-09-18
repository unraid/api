import { SetMetadata } from '@nestjs/common';

export const IS_AUTHENTICATED_ENDPOINT_KEY = 'isAuthenticatedEndpoint';

// For empty mutation namespaces; their child handlers enforce resource permissions.
export const Authenticated = (): MethodDecorator => SetMetadata(IS_AUTHENTICATED_ENDPOINT_KEY, true);
