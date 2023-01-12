import { vi } from 'vitest';

vi.mock('@app/core/utils/misc/send-form-to-keyserver', () => {
	const sendFormToKeyServer = vi.fn().mockResolvedValue(
		{ body: JSON.stringify({ valid: true }) });
	return { sendFormToKeyServer };
});

