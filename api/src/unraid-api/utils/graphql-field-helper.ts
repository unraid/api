import type { GraphQLResolveInfo } from 'graphql';
import graphqlFields from 'graphql-fields';

export interface RequestedFields {
    [key: string]: RequestedFields | {};
}

export interface GraphQLFieldOptions {
    processArguments?: boolean;
    excludedFields?: string[];
}

export class GraphQLFieldHelper {
    static getRequestedFields(info: GraphQLResolveInfo, options?: GraphQLFieldOptions): RequestedFields {
        return graphqlFields(info, {}, options);
    }

    static isFieldRequested(info: GraphQLResolveInfo, fieldPath: string): boolean {
        const fields = this.getRequestedFields(info);
        const pathParts = fieldPath.split('.');

        let current: RequestedFields | {} = fields;
        for (const part of pathParts) {
            if (!(part in current)) {
                return false;
            }
            current = current[part as keyof typeof current] as RequestedFields | {};
        }

        return true;
    }

    static getRequestedFieldsList(info: GraphQLResolveInfo): string[] {
        const fields = this.getRequestedFields(info);
        return Object.keys(fields);
    }

    static hasNestedFields(info: GraphQLResolveInfo, fieldName: string): boolean {
        const fields = this.getRequestedFields(info);
        const field = fields[fieldName];
        return field !== undefined && Object.keys(field).length > 0;
    }

    static getNestedFields(info: GraphQLResolveInfo, fieldName: string): RequestedFields | null {
        const fields = this.getRequestedFields(info);
        const field = fields[fieldName];

        if (!field || typeof field !== 'object') {
            return null;
        }

        // graphql-fields returns {} for fields without nested selections
        if (Object.keys(field).length === 0) {
            return null;
        }

        return field as RequestedFields;
    }

    static shouldFetchRelation(info: GraphQLResolveInfo, relationName: string): boolean {
        return this.isFieldRequested(info, relationName) && this.hasNestedFields(info, relationName);
    }
}
