import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Plugin {
    @Field({ description: 'The name of the plugin package' })
    name!: string;

    @Field({ description: 'The version of the plugin package' })
    version!: string;

    @Field({ nullable: true, description: 'Whether the plugin has an API module' })
    hasApiModule?: boolean;

    @Field({ nullable: true, description: 'Whether the plugin has a CLI module' })
    hasCliModule?: boolean;
}

@InputType()
export class PluginManagementInput {
    @Field(() => [String], { description: 'Array of plugin package names to add or remove' })
    names!: string[];

    @Field({
        defaultValue: false,
        description:
            'Whether to treat plugins as bundled plugins. Bundled plugins are installed to node_modules at build time and controlled via config only.',
    })
    bundled!: boolean;

    @Field({
        defaultValue: true,
        description:
            'Whether to restart the API after the operation. When false, a restart has already been queued.',
    })
    restart!: boolean;
}
