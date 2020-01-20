let connectionCount = 0;

/**
 * Return current ws connection count.
 */
export const getWsConectionCount = () => connectionCount;

/**
 * Set ws connection count to a specific number.
 */
export const setWsConectionCount = (count: number) => {
    connectionCount = count;
    return count;
};

/**
 * Increase ws connection count by 1.
 */
export const increaseWsConectionCount = () => {
    connectionCount++;
    return connectionCount;
};

/**
 * Decrease ws connection count by 1.
 */
export const decreaseWsConectionCount = () => {
    connectionCount--;
    return connectionCount;
};