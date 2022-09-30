/**
 * Security
 */
export type SmbSecurity =
 /**
  * When logged into the server as Guest, a macOS user can view and read/write all shares set as Public.
  * Files created or modified in the share will be owned by user nobody of the users group.
  * macOS users logged in with a user name/password previously created on the server can also view and read/write all shares set as Public.
  * In this case, files created or modified on the server will be owned by the logged in user.
  */
 'Public' |
 /**
  * When logged into the server as Guest, a macOS user can view and read(but not write) all shares set as Secure.
  * macOS users logged in with a user name/password previously created on the server can also view and read all shares set as Secure.
  * If their access right is set to read/write for the share on the server, they may also write the share.
  */
 'Secure' |
 /**
  * When logged onto the server as Guest, no Private shares are visible or accessible to any macOS user.
  * macOS users logged in with a user name/password previously created on the server may
  * have read or read/write(or have no access)according their access right for the share on the server. */
 'Private';

export type SmbShare = {
	name: string;
	enabled: boolean;
	security: SmbSecurity;
	writeList: string[];
	readList: string[];
	timemachine: {
		volsizelimit: number;
	};
};

export type SmbShares = SmbShare[];
