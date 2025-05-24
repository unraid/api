import { graphql } from '~/composables/gql/gql';

export const BACKUP_JOBS_QUERY = graphql(/* GraphQL */ `
  query BackupJobs {
    backup {
      id
      jobs {
        id
        type
        stats
        formattedBytes
        formattedSpeed
        formattedElapsedTime
        formattedEta
      }
    }
  }
`);

export const BACKUP_JOB_QUERY = graphql(/* GraphQL */ `
  query BackupJob($jobId: String!) {
    backupJob(jobId: $jobId) {
      id
      type
      stats
    }
  }
`);

export const BACKUP_JOB_CONFIGS_QUERY = graphql(/* GraphQL */ `
  query BackupJobConfigs {
    backup {
      id
      configs {
        id
        name
        sourcePath
        remoteName
        destinationPath
        schedule
        enabled
        createdAt
        updatedAt
        lastRunAt
        lastRunStatus
      }
    }
  }
`);

export const BACKUP_JOB_CONFIG_FORM_QUERY = graphql(/* GraphQL */ `
  query BackupJobConfigForm($input: BackupJobConfigFormInput) {
    backupJobConfigForm(input: $input) {
      id
      dataSchema
      uiSchema
    }
  }
`);

export const CREATE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation CreateBackupJobConfig($input: CreateBackupJobConfigInput!) {
    createBackupJobConfig(input: $input) {
      id
      name
      sourcePath
      remoteName
      destinationPath
      schedule
      enabled
      createdAt
      updatedAt
    }
  }
`);
