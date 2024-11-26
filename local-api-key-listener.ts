import axios from 'axios';
import { store } from '@app/store';
import { logger } from '@app/core/log';

const API_ENDPOINT = 'http://localhost:3000/api'; // Update with actual API endpoint

let previousLocalApiKey: string | null = null;

// Watch for changes in the store's config
store.subscribe(() => {
    const state = store.getState();
    const currentLocalApiKey = state.config.remote.localApiKey;

    // Only proceed if the localApiKey has changed and is not empty
    if (currentLocalApiKey !== previousLocalApiKey && currentLocalApiKey) {
        logger.info('Local API key changed, updating API service...');
        
        // Call the NestJS API endpoint
        axios.post(`${API_ENDPOINT}/auth/local-key`, {
            localApiKey: currentLocalApiKey
        })
        .then(() => {
            logger.info('Successfully updated local API key in API service');
            previousLocalApiKey = currentLocalApiKey;
        })
        .catch((error) => {
            logger.error('Failed to update local API key:', error);
        });
    }
});

// Initialize previous value
previousLocalApiKey = store.getState().config.remote.localApiKey;
