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

export const getPluginBasedOnSandbox = async (sandbox: boolean, csrfToken: string) => {
    if (sandbox) {
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
    } else {
        const { ApolloServerPluginLandingPageProductionDefault } = await import(
            '@apollo/server/plugin/landingPage/default'
        );

        const plugin = ApolloServerPluginLandingPageProductionDefault({
            footer: false,
        });
        return plugin;
    }
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
    // const sandbox = getters.config().local.sandbox === 'yes';
    const sandbox = true;
    const csrfToken = getters.emhttp().var.csrfToken;
    const plugin = await getPluginBasedOnSandbox(sandbox, csrfToken);

    if (!plugin.serverWillStart) return preconditionFailed('serverWillStart');
    const serverListener = await plugin.serverWillStart(service);

    if (!serverListener) return preconditionFailed('serverListener');
    if (!serverListener.renderLandingPage) return preconditionFailed('renderLandingPage');

    return serverListener.renderLandingPage();
}

/**
 * Apollo plugin to render the GraphQL Sandbox page on-demand based on current server state.
 *
 * Usually, the `ApolloServerPluginLandingPageLocalDefault` plugin configures its
 * parameters once, during server startup. This plugin defers the configuration
 * and rendering to request-time instead of server startup.
 */
export const sandboxPlugin: ApolloServerPlugin = {
    serverWillStart: async (service) =>
        ({
            renderLandingPage: () => renderSandboxPage(service),
        }) satisfies GraphQLServerListener,
};
