// Schema for the legacy myservers.cfg configuration file.

enum MinigraphStatus {
  PRE_INIT = "PRE_INIT",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  PING_FAILURE = "PING_FAILURE",
  ERROR_RETRYING = "ERROR_RETRYING",
}

enum DynamicRemoteAccessType {
  STATIC = "STATIC",
  UPNP = "UPNP",
  DISABLED = "DISABLED",
}

// TODO Currently registered in the main api, but this will eventually be the source of truth.
//
// registerEnumType(MinigraphStatus, {
//   name: "MinigraphStatus",
//   description: "The status of the minigraph",
// });
//
// registerEnumType(DynamicRemoteAccessType, {
//   name: "DynamicRemoteAccessType",
//   description: "The type of dynamic remote access",
// });

export type MyServersConfig = {
  api: {
    version: string;
    extraOrigins: string;
  };
  local: {
    sandbox: "yes" | "no";
  };
  remote: {
    wanaccess: string;
    wanport: string;
    upnpEnabled: string;
    apikey: string;
    localApiKey: string;
    email: string;
    username: string;
    avatar: string;
    regWizTime: string;
    accesstoken: string;
    idtoken: string;
    refreshtoken: string;
    dynamicRemoteAccessType: DynamicRemoteAccessType;
    ssoSubIds: string;
  };
};

/** In-Memory representation of the legacy myservers.cfg configuration file */
export type MyServersConfigMemory = MyServersConfig & {
  connectionStatus: {
    minigraph: MinigraphStatus;
    upnpStatus?: string | null;
  };
};
