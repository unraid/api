import { PathsConfig } from '../../../config/paths.config.js';

export const createSshClient = () => {
    const paths = PathsConfig.getInstance();
    const keyPath = paths.keyfileBase;
    // Rest of implementation
}; 