import { UnraidAPIPlugin } from "@app/unraid-api/plugin/plugin.interface.js";
import { ConnectModule } from "./connect.module.js";
import { ConnectResolver } from "./connect.resolver.js";
import { ConnectController } from "./connect.controller.js";
import { ConnectService } from "./connect.service.js";
import { AppDispatch, RootState } from "@app/store/index.js";
import { ConnectCommand } from "./cli/connect.command.js";
import { SSOCommand } from "./cli/sso/sso.command.js";

export class ConnectPlugin extends UnraidAPIPlugin {
  metadata = {
    name: "Connect",
    version: "1.0.0",
    description: "Unraid Connect Plugin - Used to enable remote access to Unraid",
  };

  commands = [SSOCommand];

  getStore(): { state: RootState; dispatch: AppDispatch } {
    return this.store;
  }

  async registerGraphQLResolvers(): Promise<any[]> {
    return [ConnectResolver];
  }

  async registerGraphQLTypeDefs(): Promise<string> {
    return `
      type Connect {
        id: ID!
        remoteAccess: RemoteAccess!
      }

      type RemoteAccess {
        enabled: Boolean!
        url: String
        expiresAt: String
      }

      input EnableDynamicRemoteAccessInput {
        enabled: Boolean!
        url: String
      }

      extend type Query {
        connect: Connect!
      }

      extend type Mutation {
        enableDynamicRemoteAccess(input: EnableDynamicRemoteAccessInput!): Boolean!
      }
    `;
  }

  async registerRESTControllers(): Promise<any[]> {
    return [ConnectController];
  }

  async registerRESTRoutes(): Promise<any[]> {
    return [];
  }

  async registerServices(): Promise<any[]> {
    return [ConnectService];
  }

  async registerCronJobs(): Promise<any[]> {
    return [];
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connect Plugin initialized');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Connect Plugin destroyed');
  }
}
