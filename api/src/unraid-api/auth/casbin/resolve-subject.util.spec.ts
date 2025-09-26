import { UnauthorizedException } from '@nestjs/common';

import { describe, expect, it } from 'vitest';

import { resolveSubjectFromUser } from '@app/unraid-api/auth/casbin/resolve-subject.util.js';

describe('resolveSubjectFromUser', () => {
    it('returns trimmed user id when available', () => {
        const subject = resolveSubjectFromUser({ id: '  user-123  ', roles: ['viewer'] });

        expect(subject).toBe('user-123');
    });

    it('falls back to a single non-empty role', () => {
        const subject = resolveSubjectFromUser({ roles: ['  viewer  '] });

        expect(subject).toBe('viewer');
    });

    it('throws when role list is empty', () => {
        expect(() => resolveSubjectFromUser({ roles: [] })).toThrow(UnauthorizedException);
    });

    it('throws when multiple roles are present', () => {
        expect(() => resolveSubjectFromUser({ roles: ['viewer', 'admin'] })).toThrow(
            UnauthorizedException
        );
    });

    it('throws when roles is not an array', () => {
        expect(() => resolveSubjectFromUser({ roles: 'viewer' as unknown })).toThrow(
            UnauthorizedException
        );
    });

    it('throws when role subject is blank', () => {
        expect(() => resolveSubjectFromUser({ roles: ['  '] })).toThrow(UnauthorizedException);
    });

    it('throws when user is missing', () => {
        expect(() => resolveSubjectFromUser(undefined)).toThrow(UnauthorizedException);
    });
});
