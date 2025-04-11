import { Module } from '@nestjs/common';

import { ArrayMutationsResolver } from '@app/unraid-api/graph/resolvers/array/array.mutations.resolver.js';
import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { ParityCheckMutationsResolver } from '@app/unraid-api/graph/resolvers/array/parity.mutations.resolver.js';
import { ParityResolver } from '@app/unraid-api/graph/resolvers/array/parity.resolver.js';
import { ParityService } from '@app/unraid-api/graph/resolvers/array/parity.service.js';

@Module({
    imports: [],
    providers: [
        ArrayService,
        ParityService,
        ArrayMutationsResolver,
        ParityResolver,
        ArrayResolver,
        ParityCheckMutationsResolver,
    ],
})
export class ArrayModule {}
