import useTeleport from '@/composables/useTeleport';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';

// Mock Vue's computed
vi.mock('vue', () => ({
  computed: vi.fn((fn) => {
    const result = { value: fn() };
    return result;
  }),
}));

describe('useTeleport', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return teleportTarget computed property', () => {
    const { teleportTarget } = useTeleport();
    expect(teleportTarget).toBeDefined();
    expect(teleportTarget).toHaveProperty('value');
  });

  it('should return #modals when element with id="modals" exists', () => {
    // Create element with id="modals"
    const modalsDiv = document.createElement('div');
    modalsDiv.id = 'modals';
    document.body.appendChild(modalsDiv);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#modals');
  });

  it('should prioritize #modals id over mounted unraid-modals', () => {
    // Create both elements
    const modalsDiv = document.createElement('div');
    modalsDiv.id = 'modals';
    document.body.appendChild(modalsDiv);

    const unraidModals = document.createElement('unraid-modals');
    unraidModals.setAttribute('data-vue-mounted', 'true');
    document.body.appendChild(unraidModals);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#modals');
  });

  it('should return mounted unraid-modals with inner #modals div', () => {
    // Create mounted unraid-modals with inner modals div
    const unraidModals = document.createElement('unraid-modals');
    unraidModals.setAttribute('data-vue-mounted', 'true');

    const innerModals = document.createElement('div');
    innerModals.id = 'modals';
    unraidModals.appendChild(innerModals);

    document.body.appendChild(unraidModals);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#modals');
  });

  it('should add id to mounted unraid-modals when no inner modals div exists', () => {
    // Create mounted unraid-modals without inner div
    const unraidModals = document.createElement('unraid-modals');
    unraidModals.setAttribute('data-vue-mounted', 'true');
    document.body.appendChild(unraidModals);

    const { teleportTarget } = useTeleport();
    expect(unraidModals.id).toBe('unraid-modals-teleport-target');
    expect(teleportTarget.value).toBe('#unraid-modals-teleport-target');
  });

  it('should use existing id of mounted unraid-modals if present', () => {
    // Create mounted unraid-modals with existing id
    const unraidModals = document.createElement('unraid-modals');
    unraidModals.setAttribute('data-vue-mounted', 'true');
    unraidModals.id = 'custom-modals-id';
    document.body.appendChild(unraidModals);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#custom-modals-id');
  });

  it('should ignore unmounted unraid-modals elements', () => {
    // Create unmounted unraid-modals (without data-vue-mounted attribute)
    const unraidModals = document.createElement('unraid-modals');
    document.body.appendChild(unraidModals);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('body');
  });

  it('should ignore unraid-modals with data-vue-mounted="false"', () => {
    // Create unraid-modals with data-vue-mounted="false"
    const unraidModals = document.createElement('unraid-modals');
    unraidModals.setAttribute('data-vue-mounted', 'false');
    document.body.appendChild(unraidModals);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('body');
  });

  it('should return body as fallback when no suitable target exists', () => {
    // No elements in DOM
    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('body');
  });

  it('should handle multiple unraid-modals elements correctly', () => {
    // Create multiple unraid-modals, only one mounted
    const unmountedModals1 = document.createElement('unraid-modals');
    document.body.appendChild(unmountedModals1);

    const mountedModals = document.createElement('unraid-modals');
    mountedModals.setAttribute('data-vue-mounted', 'true');
    mountedModals.id = 'mounted-modals';
    document.body.appendChild(mountedModals);

    const unmountedModals2 = document.createElement('unraid-modals');
    document.body.appendChild(unmountedModals2);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#mounted-modals');
  });

  it('should handle nested modal elements correctly', () => {
    // Create nested structure
    const container = document.createElement('div');

    const unraidModals = document.createElement('unraid-modals');
    unraidModals.setAttribute('data-vue-mounted', 'true');

    const innerDiv = document.createElement('div');
    const innerModals = document.createElement('div');
    innerModals.id = 'modals';

    innerDiv.appendChild(innerModals);
    unraidModals.appendChild(innerDiv);
    container.appendChild(unraidModals);
    document.body.appendChild(container);

    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#modals');
  });

  it('should be reactive to DOM changes', () => {
    const { teleportTarget } = useTeleport();

    // Initially should be body
    expect(teleportTarget.value).toBe('body');

    // Add modals element
    const modalsDiv = document.createElement('div');
    modalsDiv.id = 'modals';
    document.body.appendChild(modalsDiv);

    // Re-evaluate computed
    const newValue = (computed as unknown as { mock: { calls: unknown[] } }).mock.calls[0][0]();
    expect(newValue).toBe('#modals');
  });
});
