import { PathsConfig } from '../../../config/paths.config.js';

export const createEmhttpdClient = () => {
    const paths = PathsConfig.getInstance();
    const socketPath = paths.emhttpdSocket;
    // Rest of implementation
}; 