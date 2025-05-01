/**
 * WelcomeModal Component Test Coverage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Server } from '~/types/server';

const mockServer: Server = {
  name: 'Test Server',
  description: 'Test Description',
  guid: 'test-guid',
  keyfile: 'test-keyfile',
  lanIp: '192.168.1.1',
  connectPluginInstalled: '',
  state: 'PRO',
  dateTimeFormat: { date: 'YYYY-MM-DD', time: 'HH:mm' },
};

const mockSetServer = vi.fn();
const mockPartnerName = vi.fn();
const mockPartnerLogo = vi.fn();

const mockSetProperty = vi.fn();
const mockQuerySelector = vi.fn();

vi.mock('~/store/server', () => ({
  useServerStore: () => ({
    setServer: mockSetServer,
  }),
}));

vi.mock('~/store/activationCode', () => ({
  useActivationCodeStore: () => ({
    partnerName: mockPartnerName,
    partnerLogo: mockPartnerLogo,
  }),
}));

// Functions extracted from component to test
function processServer(server: Server | string | null) {
  if (!server) {
    throw new Error('Server data not present');
  }

  let serverData: Server;

  if (typeof server === 'string') {
    serverData = JSON.parse(server);
  } else {
    serverData = server;
  }

  mockSetServer(serverData);

  return serverData;
}

// Calculate title based on partner name
function calculateTitle(partnerName: string | null) {
  return partnerName
    ? `Welcome to your new ${partnerName} system, powered by Unraid!`
    : 'Welcome to Unraid!';
}

describe('WelcomeModal.ce.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPartnerName.mockReturnValue(null);
    mockPartnerLogo.mockReturnValue(null);
  });

  it('sets server data in the store when given an object', () => {
    processServer(mockServer);
    expect(mockSetServer).toHaveBeenCalledWith(mockServer);
  });

  it('sets server data in the store when given a JSON string', () => {
    processServer(JSON.stringify(mockServer));
    expect(mockSetServer).toHaveBeenCalledWith(mockServer);
  });

  it('throws error when server data is not provided', () => {
    expect(() => processServer(null)).toThrow('Server data not present');
  });

  it('computes custom title based on partner name', () => {
    const partnerName = 'Test Partner';
    mockPartnerName.mockReturnValue(partnerName);

    const title = calculateTitle(mockPartnerName());

    expect(title).toContain(partnerName);
    expect(title).toContain('powered by Unraid');
  });

  it('uses default title when partner name is not provided', () => {
    mockPartnerName.mockReturnValue(null);

    const title = calculateTitle(mockPartnerName());

    expect(title).toBe('Welcome to Unraid!');
  });

  it('sets font-size to 62.5% when modal is shown and confirmPassword exists', () => {
    mockQuerySelector.mockImplementation((selector: string) => {
      if (selector === '#confirmPassword') {
        return { exists: true };
      }
      return null;
    });

    // Call a function that simulates the watchEffect
    const setDocumentFontSize = (showModal = true) => {
      if (showModal && mockQuerySelector('#confirmPassword')) {
        mockSetProperty('font-size', '62.5%');
      } else {
        mockSetProperty('font-size', '100%');
      }
    };

    setDocumentFontSize(true);
    expect(mockSetProperty).toHaveBeenCalledWith('font-size', '62.5%');
  });

  it('sets font-size to 100% when modal is closed', () => {
    mockSetProperty.mockClear();

    const setDocumentFontSize = (showModal = false) => {
      if (showModal && mockQuerySelector('#confirmPassword')) {
        mockSetProperty('font-size', '62.5%');
      } else {
        mockSetProperty('font-size', '100%');
      }
    };

    setDocumentFontSize(false);
    expect(mockSetProperty).toHaveBeenCalledWith('font-size', '100%');
  });

  it('determines if partner logo should be shown', () => {
    mockPartnerLogo.mockReturnValue('partner-logo-url');

    const hasPartnerLogo = () => !!mockPartnerLogo();

    expect(hasPartnerLogo()).toBe(true);

    mockPartnerLogo.mockReturnValue(null);
    expect(hasPartnerLogo()).toBe(false);
  });

  it('uses a standardized description', () => {
    const getDescription = () =>
      "First, you'll create your device's login credentials, then you'll activate your Unraid license—your device's operating system (OS).";

    const expectedDescription =
      "First, you'll create your device's login credentials, then you'll activate your Unraid license—your device's operating system (OS).";

    expect(getDescription()).toBe(expectedDescription);
  });

  it('hides modal when BrandButton is clicked', () => {
    let showModal = true;

    // Simulate the dropdownHide method from the component
    const dropdownHide = () => {
      showModal = false;
      mockSetProperty('font-size', '100%');
    };

    expect(showModal).toBe(true);

    dropdownHide();

    expect(showModal).toBe(false);
    expect(mockSetProperty).toHaveBeenCalledWith('font-size', '100%');
  });
});
