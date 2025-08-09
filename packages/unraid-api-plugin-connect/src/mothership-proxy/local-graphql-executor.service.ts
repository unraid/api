import { Injectable, Logger } from '@nestjs/common';
import { gql } from '@apollo/client/core/index.js';
import { parse, print, visit } from 'graphql';

import { InternalClientService } from '../internal-rpc/internal.client.js';

interface GraphQLExecutor {
  execute(params: {
    query: string
    variables?: Record<string, any>
    operationName?: string
    operationType?: 'query' | 'mutation' | 'subscription'
  }): Promise<any>
  stopSubscription?(operationId: string): Promise<void>
}

/**
 * Local GraphQL executor that maps remote queries to local API calls
 */
@Injectable()
export class LocalGraphQLExecutor implements GraphQLExecutor {
  private logger = new Logger('LocalGraphQLExecutor');

  constructor(private readonly internalClient: InternalClientService) {}

  async execute(params: {
    query: string
    variables?: Record<string, any>
    operationName?: string
    operationType?: 'query' | 'mutation' | 'subscription'
  }): Promise<any> {
    const { query, variables, operationName, operationType } = params;

    try {
      this.logger.debug(`Executing ${operationType} operation: ${operationName || 'unnamed'}`);
      this.logger.verbose(`Query: ${query}`);
      this.logger.verbose(`Variables: ${JSON.stringify(variables)}`);

      // Transform remote query to local query by removing "remote" prefixes
      const localQuery = this.transformRemoteQueryToLocal(query);

      // Execute the transformed query against local API
      const client = await this.internalClient.getClient();
      const result = await client.query({
        query: gql`${localQuery}`,
        variables,
      });

      return {
        data: result.data,
      };
    } catch (error: any) {
      this.logger.error(`GraphQL execution error: ${error?.message}`);
      return {
        errors: [
          {
            message: error?.message || 'Unknown error',
            extensions: { code: 'EXECUTION_ERROR' },
          },
        ],
      };
    }
  }

  /**
   * Transform remote GraphQL query to local query by removing "remote" prefixes
   */
  private transformRemoteQueryToLocal(query: string): string {
    try {
      // Parse the GraphQL query
      const document = parse(query);

      // Transform the document by removing "remote" prefixes
      const transformedDocument = visit(document, {
        // Transform operation names (e.g., remoteGetDockerInfo -> getDockerInfo)
        OperationDefinition: (node) => {
          if (node.name?.value.startsWith('remote')) {
            return {
              ...node,
              name: {
                ...node.name,
                value: this.removeRemotePrefix(node.name.value),
              },
            };
          }
          return node;
        },
        // Transform field names (e.g., remoteGetDockerInfo -> docker, remoteGetVms -> vms)
        Field: (node) => {
          if (node.name.value.startsWith('remote')) {
            return {
              ...node,
              name: {
                ...node.name,
                value: this.transformRemoteFieldName(node.name.value),
              },
            };
          }
          return node;
        },
      });

      // Convert back to string
      return print(transformedDocument);
    } catch (error) {
      this.logger.error(`Failed to parse/transform GraphQL query: ${error}`);
      throw error;
    }
  }

  /**
   * Remove "remote" prefix from operation names
   */
  private removeRemotePrefix(name: string): string {
    if (name.startsWith('remote')) {
      // remoteGetDockerInfo -> getDockerInfo
      return name.slice(6); // Remove "remote"
    }
    return name;
  }

  /**
   * Transform remote field names to local equivalents
   */
  private transformRemoteFieldName(fieldName: string): string {
    // Handle common patterns
    if (fieldName === 'remoteGetDockerInfo') {
      return 'docker';
    }
    if (fieldName === 'remoteGetVms') {
      return 'vms';
    }
    if (fieldName === 'remoteGetSystemInfo') {
      return 'system';
    }
    
    // Generic transformation: remove "remoteGet" and convert to camelCase
    if (fieldName.startsWith('remoteGet')) {
      const baseName = fieldName.slice(9); // Remove "remoteGet"
      return baseName.charAt(0).toLowerCase() + baseName.slice(1);
    }
    
    // Remove "remote" prefix as fallback
    if (fieldName.startsWith('remote')) {
      const baseName = fieldName.slice(6); // Remove "remote"
      return baseName.charAt(0).toLowerCase() + baseName.slice(1);
    }
    
    return fieldName;
  }

  async stopSubscription(operationId: string): Promise<void> {
    this.logger.debug(`Stopping subscription: ${operationId}`);
    // Subscription cleanup logic would go here
  }
}