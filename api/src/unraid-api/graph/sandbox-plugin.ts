import { HttpException, HttpStatus } from '@nestjs/common';

import type { ApolloServerPlugin, GraphQLServerContext, GraphQLServerListener } from '@apollo/server';

/** The initial query displayed in the Apollo sandbox */
const initialDocument = `query ExampleQuery {
    notifications {
      id
      overview {
        unread {
          info
          warning
          alert
          total
        }
        archive {
          info
          warning
          alert
          total
        }
      }
    }
  }`;

/** helper for raising precondition failure errors during an http request. */
const preconditionFailed = (preconditionName: string) => {
    throw new HttpException(`Precondition failed: ${preconditionName} `, HttpStatus.PRECONDITION_FAILED);
};

export const getSandboxPlugin = async (csrfToken: string) => {
    const { ApolloServerPluginLandingPageLocalDefault } = await import(
        '@apollo/server/plugin/landingPage/default'
    );
    const plugin = ApolloServerPluginLandingPageLocalDefault({
        footer: false,
        includeCookies: true,
        document: initialDocument,
        embed: {
            initialState: {
                sharedHeaders: {
                    'x-csrf-token': csrfToken,
                },
            },
        },
    });
    return plugin;
};

/**
 * Renders the sandbox page for the GraphQL server with Apollo Server landing page configuration.
 *
 * @param service - The GraphQL server context object
 * @returns Promise that resolves to an Apollo `LandingPage`, or throws a precondition failed error
 * @throws {Error} When downstream plugin components from apollo are unavailable. This should never happen.
 *
 * @remarks
 * This function configures and renders the Apollo Server landing page with:
 * - Disabled footer
 * - Enabled cookies
 * - Initial document state
 * - Shared headers containing CSRF token
 */
async function renderSandboxPage(service: GraphQLServerContext) {
    const { getters } = await import('@app/store/index.js');
    const csrfToken = getters.emhttp().var.csrfToken;
    const plugin = await getSandboxPlugin(csrfToken);

    if (!plugin.serverWillStart) return preconditionFailed('serverWillStart');
    const serverListener = await plugin.serverWillStart(service);

    if (!serverListener) return preconditionFailed('serverListener');
    if (!serverListener.renderLandingPage) return preconditionFailed('renderLandingPage');

    return serverListener.renderLandingPage();
}

/**
 * Apollo plugin to render the GraphQL Sandbox page.
 *
 * Access to this page is controlled by the sandbox-access-plugin which blocks
 * GET requests when sandbox is disabled. This plugin only handles rendering
 * the sandbox UI when it's allowed through.
 */
export const createSandboxPlugin = (): ApolloServerPlugin => ({
    serverWillStart: async (service) =>
        ({
            renderLandingPage: () => renderSandboxPage(service),
        }) satisfies GraphQLServerListener,
});
