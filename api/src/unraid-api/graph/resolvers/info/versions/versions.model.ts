import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType({ implements: () => Node })
export class InfoVersions extends Node {
    @Field(() => String, { nullable: true, description: 'Kernel version' })
    kernel?: string;

    @Field(() => String, { nullable: true, description: 'OpenSSL version' })
    openssl?: string;

    @Field(() => String, { nullable: true, description: 'System OpenSSL version' })
    systemOpenssl?: string;

    @Field(() => String, { nullable: true, description: 'Node.js version' })
    node?: string;

    @Field(() => String, { nullable: true, description: 'V8 engine version' })
    v8?: string;

    @Field(() => String, { nullable: true, description: 'npm version' })
    npm?: string;

    @Field(() => String, { nullable: true, description: 'Yarn version' })
    yarn?: string;

    @Field(() => String, { nullable: true, description: 'pm2 version' })
    pm2?: string;

    @Field(() => String, { nullable: true, description: 'Gulp version' })
    gulp?: string;

    @Field(() => String, { nullable: true, description: 'Grunt version' })
    grunt?: string;

    @Field(() => String, { nullable: true, description: 'Git version' })
    git?: string;

    @Field(() => String, { nullable: true, description: 'tsc version' })
    tsc?: string;

    @Field(() => String, { nullable: true, description: 'MySQL version' })
    mysql?: string;

    @Field(() => String, { nullable: true, description: 'Redis version' })
    redis?: string;

    @Field(() => String, { nullable: true, description: 'MongoDB version' })
    mongodb?: string;

    @Field(() => String, { nullable: true, description: 'Apache version' })
    apache?: string;

    @Field(() => String, { nullable: true, description: 'nginx version' })
    nginx?: string;

    @Field(() => String, { nullable: true, description: 'PHP version' })
    php?: string;

    @Field(() => String, { nullable: true, description: 'Postfix version' })
    postfix?: string;

    @Field(() => String, { nullable: true, description: 'PostgreSQL version' })
    postgresql?: string;

    @Field(() => String, { nullable: true, description: 'Perl version' })
    perl?: string;

    @Field(() => String, { nullable: true, description: 'Python version' })
    python?: string;

    @Field(() => String, { nullable: true, description: 'Python3 version' })
    python3?: string;

    @Field(() => String, { nullable: true, description: 'pip version' })
    pip?: string;

    @Field(() => String, { nullable: true, description: 'pip3 version' })
    pip3?: string;

    @Field(() => String, { nullable: true, description: 'Java version' })
    java?: string;

    @Field(() => String, { nullable: true, description: 'gcc version' })
    gcc?: string;

    @Field(() => String, { nullable: true, description: 'VirtualBox version' })
    virtualbox?: string;

    @Field(() => String, { nullable: true, description: 'Docker version' })
    docker?: string;

    @Field(() => String, { nullable: true, description: 'Unraid version' })
    unraid?: string;
}
