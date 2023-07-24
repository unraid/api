import { graphql } from '~/composables/gql/gql';

// export const SERVER_CLOUD_FRAGMENT = graphql(/* GraphQL */`
//   fragment FragmentCloud on Cloud {
//     error
//     apiKey {
//       valid
//       error
//     }
//     cloud {
//       status
//       error
//     }
//     minigraphql {
//       status
//       error
//     }
//     relay {
//       status
//       error
//     }
//   }
// `);

// export const SERVER_CONFIG_FRAGMENT = graphql(/* GraphQL */`
//   fragment FragmentConfig on Config {
//     error
//     valid
//   }
// `);

// export const SERVER_OWNER_FRAGMENT = graphql(/* GraphQL */`
//   fragment FragmentOwner on Owner {
//     avatar
//     username
//   }
// `);

// export const SERVER_REGISTRATION_FRAGMENT = graphql(/* GraphQL */`
//   fragment FragmentRegistration on Registration {
//     state
//     expiration
//     keyFile {
//       contents
//     }
//   }
// `);

// export const SERVER_VARS_FRAGMENT = graphql(/* GraphQL */`
//   fragment FragmentVars on Vars {
//     regGen
//     regState
//     configError
//     configValid
//   }
// `);

export const SERVER_STATE_QUERY = graphql(/* GraphQL */`
  query serverState {
    cloud {
      error
      apiKey {
        valid
        error
      }
      cloud {
        status
        error
      }
      minigraphql {
        status
        error
      }
      relay {
        status
        error
      }
    }
    config {
      error
      valid
    }
    info {
      os {
        hostname
      }
    }
    owner {
      avatar
      username
    }
    registration {
      state
      expiration
      keyFile {
        contents
      }
    }
    vars {
      regGen
      regState
      configError
      configValid
    }
  }
`);
