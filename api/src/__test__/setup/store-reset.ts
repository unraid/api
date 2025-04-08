import { beforeEach } from 'vitest';

import { resetStore } from '@app/store/actions/reset-store.js';
import { store } from '@app/store/index.js';

beforeEach(() => {
    store.dispatch(resetStore());
});
