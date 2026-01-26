import { PluginInstallOperationFrag } from '@/components/Activation/installPlugin.fragment';
import gql from 'graphql-tag';

export const INSTALL_LANGUAGE_MUTATION = gql`
  mutation InstallLanguage($input: InstallPluginInput!) {
    installLanguage(input: $input) {
      ...PluginInstallOperation
    }
  }
  ${PluginInstallOperationFrag}
`;
