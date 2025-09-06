// Test server state configuration for HTML test pages
// This provides mock server data similar to what Unraid OS would provide

(function () {
  'use strict';

  // Default server state matching the Unraid server data structure
  window.testServerState = {
    default: {
      avatar: 'https://source.unsplash.com/300x300/?portrait',
      config: {
        id: 'config-id',
        error: null,
        valid: true,
      },
      connectPluginInstalled: 'dynamix.unraid.net.staging.plg',
      description: 'Test Server',
      deviceCount: 3,
      expireTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      flashBackupActivated: true,
      flashProduct: 'SanDisk_3.2Gen1',
      flashVendor: 'USB',
      guid: '1111-1111-TEST-GUIDGUIDGUID',
      inIframe: false,
      keyfile: '',
      lanIp: '192.168.1.100',
      license: 'Pro',
      locale: 'en_US',
      name: 'TestServer',
      osVersion: '6.12.4',
      osVersionBranch: 'stable',
      registered: true,
      regGen: 0,
      regTm: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      regTo: 'Test User',
      regTy: 'Pro',
      regDevs: -1, // unlimited for Pro
      regExp: undefined, // no expiration for Pro
      regGuid: '1111-1111-TEST-GUIDGUIDGUID',
      site: window.location.origin,
      ssoEnabled: true,
      state: 'PRO',
      theme: {
        banner: false,
        bannerGradient: false,
        bgColor: '',
        descriptionShow: true,
        metaColor: '',
        name: 'white',
        textColor: '',
      },
      uptime: Date.now() - 60 * 60 * 1000, // 1 hour of uptime
      username: 'admin',
      wanFQDN: '',
      wanIp: '203.0.113.42',
      updateOsResponse: {
        version: '6.12.5',
        name: 'Unraid 6.12.5',
        date: '2024-01-15',
        isNewer: true,
        isEligible: true,
        changelog: 'https://docs.unraid.net/unraid-os/release-notes/6.12.5/',
        sha256: '2f5debaf80549029cf6dfab0db59180e7e3391c059e6521aace7971419c9c4bf',
      },
    },

    // Trial state configuration
    trial: {
      avatar: '',
      config: {
        id: 'config-id',
        error: null,
        valid: false,
      },
      connectPluginInstalled: null,
      description: 'Trial Server',
      deviceCount: 0,
      expireTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      flashBackupActivated: false,
      flashProduct: 'Generic_USB',
      flashVendor: 'USB',
      guid: '2222-2222-TRIAL-GUIDGUID',
      inIframe: false,
      keyfile: '',
      lanIp: '192.168.1.101',
      license: '',
      locale: 'en_US',
      name: 'TrialServer',
      osVersion: '6.12.4',
      osVersionBranch: 'stable',
      registered: false,
      regGen: 0,
      regTm: Date.now(),
      regTo: '',
      regTy: 'Trial',
      regDevs: 0,
      regExp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days trial
      regGuid: '',
      site: window.location.origin,
      ssoEnabled: false,
      state: 'TRIAL',
      theme: {
        banner: false,
        bannerGradient: false,
        bgColor: '',
        descriptionShow: true,
        metaColor: '',
        name: 'white',
        textColor: '',
      },
      uptime: Date.now() - 30 * 60 * 1000, // 30 minutes of uptime
      username: 'root',
      wanFQDN: '',
      wanIp: '',
    },

    // Expired state configuration
    expired: {
      avatar: '',
      config: {
        id: 'config-id',
        error: 'License expired',
        valid: false,
      },
      connectPluginInstalled: 'dynamix.unraid.net.staging.plg',
      description: 'Expired Server',
      deviceCount: 6,
      expireTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      flashBackupActivated: false,
      flashProduct: 'SanDisk_3.2Gen1',
      flashVendor: 'USB',
      guid: '3333-3333-EXPIRED-GUIDGUID',
      inIframe: false,
      keyfile: 'EXPIRED_KEY',
      lanIp: '192.168.1.102',
      license: 'Basic',
      locale: 'en_US',
      name: 'ExpiredServer',
      osVersion: '6.11.5',
      osVersionBranch: 'stable',
      registered: true,
      regGen: 0,
      regTm: Date.now() - 400 * 24 * 60 * 60 * 1000, // 400 days ago
      regTo: 'Expired User',
      regTy: 'Basic',
      regDevs: 6,
      regExp: Date.now() - 7 * 24 * 60 * 60 * 1000, // expired 7 days ago
      regGuid: '3333-3333-EXPIRED-GUIDGUID',
      site: window.location.origin,
      ssoEnabled: false,
      state: 'EEXPIRED',
      theme: {
        banner: false,
        bannerGradient: false,
        bgColor: '',
        descriptionShow: true,
        metaColor: '',
        name: 'white',
        textColor: '',
      },
      uptime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days of uptime
      username: 'admin',
      wanFQDN: '',
      wanIp: '',
    },
  };

  // Function to get current server state
  window.getTestServerState = function (type = 'default') {
    return window.testServerState[type] || window.testServerState.default;
  };

  // Function to update server state for testing
  window.updateTestServerState = function (type = 'default', updates = {}) {
    if (!window.testServerState[type]) {
      console.warn('Unknown server state type:', type);
      return;
    }

    window.testServerState[type] = {
      ...window.testServerState[type],
      ...updates,
    };

    // Trigger update event for components
    const event = new CustomEvent('unraid:server-state-updated', {
      detail: {
        type: type,
        state: window.testServerState[type],
      },
    });
    document.dispatchEvent(event);

    console.log('Server state updated:', type, updates);
  };

  // Function to pass server state to components via attributes
  window.applyServerStateToComponents = function (type = 'default') {
    const state = window.getTestServerState(type);
    const stateJson = JSON.stringify(state);

    // Apply to common components that need server state
    const componentsNeedingState = [
      'unraid-user-profile',
      'unraid-header-os-version',
      'unraid-registration',
      'unraid-connect-settings',
      'unraid-update-os',
      'unraid-downgrade-os',
    ];

    componentsNeedingState.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.setAttribute('server', stateJson);
        console.log(`Applied server state to ${selector}`);
      });
    });
  };

  // Auto-apply default server state when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        window.applyServerStateToComponents('default');
      }, 500); // Small delay to ensure components are mounted
    });
  } else {
    setTimeout(function () {
      window.applyServerStateToComponents('default');
    }, 500);
  }

  console.log('Test server state helper loaded. Available states:', Object.keys(window.testServerState));
})();
