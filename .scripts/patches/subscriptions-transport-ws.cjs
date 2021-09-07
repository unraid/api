import fs from 'fs';

const paths = {
    server: './node_modules/subscriptions-transport-ws/dist/server.js',
    emptyIterable: './node_modules/subscriptions-transport-ws/dist/utils/empty-iterable.js'
};

const patched = {};
const patchLogger = whatIsBeingPatched => {
    const hasBeenPatched = patched[whatIsBeingPatched];
    if (!hasBeenPatched) {
        patched[whatIsBeingPatched] = true;
        console.info(`Trying to patch ${whatIsBeingPatched}`);
    } else {
        console.info(`Patched successfully!`);
    }
};

// src/server.js
// See https://github.com/apollographql/subscriptions-transport-ws/issues/433
{
    patchLogger('src/server.js');
    const serverJs = fs.readFileSync(paths.server).toString();
    const content = serverJs.split('\n').map(line => {
        // Update this line
        if (line.includes('connectionContext.operations[opId] = subscription;')) {
            // Don't update it if we already have
            if (!line.includes('isMock')) {
                return `if (connectionContext.operations[opId].hasOwnProperty('isMock') === false) { subscription.return(); } else { connectionContext.operations[opId] = subscription; }`;
            }
        }
        return line;
    }).join('\n');
    fs.writeFileSync(paths.server, content);
    patchLogger('src/server.js');
}

// src/utils/empty-iterable.js
// See https://github.com/apollographql/subscriptions-transport-ws/issues/433
{
    patchLogger('src/utils/empty-iterable.js');
    const content = `
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        var iterall_1 = require("iterall");
        exports.createEmptyIterable = function () {
            var _a;
            return _a = {
                    isMock: true,
                    next: function () {
                        return Promise.resolve({ value: undefined, done: true });
                    },
                    return: function () {
                        return Promise.resolve({ value: undefined, done: true });
                    },
                    throw: function (e) {
                        return Promise.reject(e);
                    }
                },
                _a[iterall_1.$$asyncIterator] = function () {
                    return this;
                },
                _a;
        };
    `;

    fs.writeFileSync(paths.emptyIterable, content);
    patchLogger('src/utils/empty-iterable.js');
}