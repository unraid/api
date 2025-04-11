import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Online {
    @Field(() => Boolean)
    online: boolean = true;
}
