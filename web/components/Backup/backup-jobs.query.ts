import { graphql } from '~/composables/gql/gql';


export const BACKUP_STATS_FRAGMENT = graphql(/* GraphQL */ `
  fragment BackupStats on RCloneJobStats {
    bytes
    speed
    eta
    elapsedTime
    percentage
    checks
    deletes
    errors
    fatalError
    lastError
    renames
    retryError
    serverSideCopies
    serverSideCopyBytes
    serverSideMoves
    serverSideMoveBytes
    totalBytes
    totalChecks
    totalTransfers
    transferTime
    transfers
    transferring
    checking
    formattedBytes
    formattedSpeed
    formattedElapsedTime
    formattedEta
  }
`);

export const BACKUP_JOBS_QUERY = graphql(/* GraphQL */ `
  query BackupJobs {
    backup {
      id
      jobs {
        id
        group
        configId
        finished
        success
        error
        detailedStatus
        stats {
          ...BackupStats
        }
      }
    }
  }
`);

export const BACKUP_JOB_QUERY = graphql(/* GraphQL */ `
  query BackupJob($jobId: PrefixedID!) {
    backupJob(jobId: $jobId) {
      id
      group
      configId
      finished
      success
      error
      detailedStatus
      stats {
        ...BackupStats
      }
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
        currentJobId
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
    backup {
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
        currentJobId
      }
    }
  }
`);

export const UPDATE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateBackupJobConfig($id: String!, $input: UpdateBackupJobConfigInput!) {
    backup {
      updateBackupJobConfig(id: $id, input: $input) {
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
        currentJobId
      }
    }
  }
`);

export const DELETE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteBackupJobConfig($id: String!) {
    backup {
      deleteBackupJobConfig(id: $id)
    }
  }
`);

export const TOGGLE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation ToggleBackupJobConfig($id: String!) {
    backup {
      toggleJobConfig(id: $id) {
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
        currentJobId
      }
    }
  }
`);

export const TRIGGER_BACKUP_JOB_MUTATION = graphql(/* GraphQL */ `
  mutation TriggerBackupJob($id: PrefixedID!) {
    backup {
      triggerJob(id: $id) {
        status
        jobId
      }
    }
  }
`);

export const INITIATE_BACKUP_MUTATION = graphql(/* GraphQL */ `
  mutation InitiateBackup($input: InitiateBackupInput!) {
    backup {
      initiateBackup(input: $input) {
        status
        jobId
      }
    }
  }
`);

export const BACKUP_JOB_PROGRESS_SUBSCRIPTION = graphql(/* GraphQL */ `
  subscription BackupJobProgress($jobId: PrefixedID!) {
    backupJobProgress(jobId: $jobId) {
      id
      stats {
        ...BackupStats
      }
    }
  }
`);