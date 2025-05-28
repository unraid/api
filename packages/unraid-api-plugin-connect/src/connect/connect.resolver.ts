import { ConfigService } from "@nestjs/config";
import { Resolver, Query, Mutation, ResolveField } from "@nestjs/graphql";
import { AuthActionVerb, AuthPossession, demoShared, UsePermissions } from "@unraid/shared";
import { Connect, ConnectSettings, DynamicRemoteAccessStatus } from "./connect.model.js";
import { Logger } from "@nestjs/common";
import { DynamicRemoteAccessType } from "../config.entity.js";

@Resolver()
export class HealthResolver {
  constructor(private readonly configService: ConfigService) {}

  @Query(() => String)
  health() {
    // You can replace the return value with your actual health check logic
    return demoShared;
  }

  @Query(() => String)
  getDemo() {
    return this.configService.get("connect.demo");
  }

  @Mutation(() => String)
  async setDemo() {
    const newValue = new Date().toISOString();
    this.configService.set("connect.demo", newValue);
    return newValue;
  }
}

// @Resolver(() => Connect)
// export class ConnectResolver {
//     protected logger = new Logger(ConnectResolver.name);
//     constructor() {}

//     @Query(() => Connect)
//     @UsePermissions({
//         action: AuthActionVerb.READ,
//         resource: Resource.CONNECT,
//         possession: AuthPossession.ANY,
//     })
//     public connect(): Connect {
//         return {
//             id: 'connect',
//         };
//     }

//     @ResolveField(() => String)
//     public id() {
//         return 'connect';
//     }

//     @ResolveField(() => DynamicRemoteAccessStatus)
//     public dynamicRemoteAccess(): DynamicRemoteAccessStatus {
//         const state = store.getState();
//         return {
//             runningType: state.dynamicRemoteAccess.runningType,
//             enabledType: state.config.remote.dynamicRemoteAccessType ?? DynamicRemoteAccessType.DISABLED,
//             error: state.dynamicRemoteAccess.error ?? undefined,
//         };
//     }

//     @ResolveField(() => ConnectSettings)
//     public async settings(): Promise<ConnectSettings> {
//         return {} as ConnectSettings;
//     }
// }