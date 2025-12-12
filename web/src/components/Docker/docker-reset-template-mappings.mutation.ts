import { gql } from '@apollo/client';

export const RESET_DOCKER_TEMPLATE_MAPPINGS = gql`
  mutation ResetDockerTemplateMappings {
    resetDockerTemplateMappings
  }
`;
