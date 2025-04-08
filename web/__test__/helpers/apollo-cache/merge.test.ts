import { mergeAndDedup } from '~/helpers/apollo-cache/merge';
import { describe, expect, it } from 'vitest';

import type { ApolloCacheItem } from '~/helpers/apollo-cache/merge';

describe('mergeAndDedup', () => {
  const createRef = (id: unknown) => ({ __ref: `Post:${id}` });
  const getRef = (item: ApolloCacheItem) => item.__ref;

  describe('basic functionality', () => {
    it('should concatenate when there are no duplicates', () => {
      const existing = [createRef(1), createRef(2), createRef(3)];
      const incoming = [createRef(4), createRef(5)];

      const result = mergeAndDedup(existing, incoming, getRef, {
        offset: existing.length,
      });

      expect(result).toEqual([
        createRef(1), // From existing
        createRef(2), // From existing
        createRef(3), // From existing
        createRef(4), // From incoming
        createRef(5), // From incoming
      ]);
    });

    it('should merge without duplicates when offset is 0', () => {
      const existing = [createRef(1), createRef(2), createRef(3)];

      const incoming = [
        createRef(3), // Duplicate
        createRef(4), // New
      ];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 0 });

      expect(result).toEqual([
        createRef(3), // From incoming
        createRef(4), // From incoming
      ]);
    });

    it('should merge without duplicates when offset > 0', () => {
      const existing = [createRef(1), createRef(2), createRef(3), createRef(5)];

      const incoming = [
        createRef(2), // Duplicate
        createRef(4), // New
      ];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 1 });

      expect(result).toEqual([
        createRef(1), // From existing
        createRef(2), // From incoming
        createRef(4), // From incoming
        createRef(5), // From existing
      ]);
    });

    it('should handle duplicates > range of replacement', () => {
      const existing = [createRef(1), createRef(2), createRef(3), createRef(4), createRef(2)];

      const incoming = [
        createRef(2), // Duplicate
        createRef(4), // New
      ];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 1 });

      expect(result).toEqual([
        createRef(1), // From existing
        createRef(2), // From incoming
        createRef(4), // From incoming
      ]);
    });

    it('should handle duplicate < range of replacement', () => {
      const existing = [createRef(4), createRef(2), createRef(3), createRef(1)];

      const incoming = [
        createRef(2), // Duplicate
        createRef(4), // New
      ];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 1 });

      expect(result).toEqual([
        createRef(2), // From incoming
        createRef(4), // From incoming
        createRef(1), // From existing
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty existing array', () => {
      const existing = [] as ApolloCacheItem[];
      const incoming = [createRef(1), createRef(2)];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 0 });

      expect(result).toEqual([createRef(1), createRef(2)]);
    });

    it('should handle empty incoming array', () => {
      const existing = [createRef(1), createRef(2)];
      const incoming: ApolloCacheItem[] = [];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 0 });

      expect(result).toEqual(existing);
    });

    it('should handle undefined existing array', () => {
      const incoming = [createRef(1), createRef(2)];

      const result = mergeAndDedup(undefined, incoming, getRef, { offset: 0 });

      expect(result).toEqual(incoming);
    });

    it('should handle undefined args', () => {
      const existing = [createRef(1)];
      const incoming = [createRef(2)];

      const result = mergeAndDedup(existing, incoming, getRef);

      expect(result).toEqual([createRef(2)]);
    });

    it('should handle offset larger than existing array', () => {
      const existing = [createRef(1)];
      const incoming = [createRef(2)];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 5 });

      expect(result).toEqual([createRef(1), createRef(2)]);
    });
  });

  describe('multiple duplicates', () => {
    it('should not overwrite multiple duplicates in incoming data', () => {
      const existing = [createRef(1), createRef(2), createRef(3)];

      const incoming = [
        createRef(2), // First duplicate
        createRef(3), // Second duplicate
        createRef(2), // Third duplicate (duplicate within incoming)
      ];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 0 });

      expect(result).toEqual([createRef(2), createRef(3), createRef(2)]);
    });

    it('should handle duplicates with gaps in offset', () => {
      const existing = [createRef(1), createRef(2), createRef(3), createRef(4)];

      const incoming = [
        createRef(2), // Duplicate
        createRef(4), // Duplicate
      ];

      const result = mergeAndDedup(existing, incoming, getRef, { offset: 2 });

      expect(result).toEqual([
        createRef(1), // From existing
        createRef(2), // From incoming
        createRef(4), // From incoming
      ]);
    });
  });
});
