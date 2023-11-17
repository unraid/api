import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class VmsResolver {
    @Query()
    public async vms() {
        /**
         * @todo Method implemntation
         */
        return {};
    }
}
