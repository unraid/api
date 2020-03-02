import { ApolloServer } from 'apollo-server-express';
import { Server as HttpServer } from 'http';
import WebSocket from 'ws';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { formatApolloErrors } from 'apollo-server-errors';
import { execute, subscribe, ExecutionResult } from 'graphql';

interface Server extends ApolloServer {
  installSubscriptionHandlers(server: HttpServer | WebSocket.Server): SubscriptionServer
}

/**
 * @NOTE: https://github.com/apollographql/apollo-server/pull/2314
 */
export const createServer = (options): Server => {
  // I used Object.create here because I was getting "constructor must be called
  // with new" type errors when I tried extending the ApolloServer class, even
  // though I was using new.  I guess it's something to do with extending classes
  // from TypeScript.
  return Object.create(
    new ApolloServer(options),
    {
      installSubscriptionHandlers: {
        /**
         * This is a fork of ApolloServer.installSubscriptionHandlers that allows us
         * to pass a WebSocket.Server as a workaround.
         */
        value(server: HttpServer | WebSocket.Server): SubscriptionServer {
          if (!this.subscriptionServerOptions) {
            if (this.supportsSubscriptions()) {
              throw Error('Subscriptions are disabled, due to subscriptions set to false in the ApolloServer constructor')
            } else {
              throw Error(
                'Subscriptions are not supported, choose an integration, such as apollo-server-express that allows persistent connections'
              )
            }
          }

          const { onDisconnect, onConnect, keepAlive, path } = this.subscriptionServerOptions;

          return (this.subscriptionServer = SubscriptionServer.create(
            {
              schema: this.schema,
              execute,
              subscribe,
              onConnect: onConnect ? onConnect : (connectionParams: Object) => ({ ...connectionParams }),
              onDisconnect,
              onOperation: async (message: { payload: any }, connection: any) => {
                connection.formatResponse = (value: ExecutionResult) => ({
                  ...value,
                  errors:
                    value.errors &&
                    formatApolloErrors([...value.errors], {
                      formatter: this.requestOptions.formatError,
                      debug: this.requestOptions.debug,
                    }),
                })
                let context = this.context ? this.context : { connection }

                try {
                  context =
                    typeof this.context === 'function' ? await this.context({ connection, payload: message.payload }) : context
                } catch (e) {
                  throw formatApolloErrors([e], {
                    formatter: this.requestOptions.formatError,
                    debug: this.requestOptions.debug,
                  })[0]
                }

                return { ...connection, context }
              },
              keepAlive,
            },
            server instanceof WebSocket.Server
              ? server
              : {
                server,
                path,
              }
          ))
        }
      }
    }
  )
}