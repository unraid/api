/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * Network interface
 * @interface NetworkInterface
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NetworkInterface {
	// DHCP_KEEPRESOLV="no"
	// DNS_SERVER1="1.1.1.1"
	// DNS_SERVER2="8.8.8.8"
	// DHCP6_KEEPRESOLV="no"
	// BONDING="yes"
	// BONDNAME=""
	// BONDNICS="eth0,eth1,eth2,eth3"
	// BONDING_MODE="1"
	// BONDING_MIIMON="100"
	// BRIDGING="yes"
	// BRNAME=""
	// BRNICS="bond0"
	// BRSTP="0"
	// BRFD="0"
	// DESCRIPTION:0=""
	// PROTOCOL:0=""
	// USE_DHCP:0="yes"
	// IPADDR:0="192.168.1.129"
	// NETMASK:0="255.255.255.0"
	// GATEWAY:0="192.168.1.1"
	// METRIC:0=""
	// USE_DHCP6:0=""
	// IPADDR6:0=""
	// NETMASK6:0=""
	// GATEWAY6:0=""
	// METRIC6:0=""
	// PRIVACY6:0=""
	// MTU=""
	// TYPE="access"
}

/**
 * Network
 * @interface Network
 */
export interface Network {
	interfaces: NetworkInterface[];
}

// [eth0]
// DHCP_KEEPRESOLV="no"
// DNS_SERVER1="1.1.1.1"
// DNS_SERVER2="8.8.8.8"
// DHCP6_KEEPRESOLV="no"
// BONDING="yes"
// BONDNAME=""
// BONDNICS="eth0,eth1,eth2,eth3"
// BONDING_MODE="1"
// BONDING_MIIMON="100"
// BRIDGING="yes"
// BRNAME=""
// BRNICS="bond0"
// BRSTP="0"
// BRFD="0"
// DESCRIPTION:0=""
// PROTOCOL:0=""
// USE_DHCP:0="yes"
// IPADDR:0="192.168.1.129"
// NETMASK:0="255.255.255.0"
// GATEWAY:0="192.168.1.1"
// METRIC:0=""
// USE_DHCP6:0=""
// IPADDR6:0=""
// NETMASK6:0=""
// GATEWAY6:0=""
// METRIC6:0=""
// PRIVACY6:0=""
// MTU=""
// TYPE="access"
