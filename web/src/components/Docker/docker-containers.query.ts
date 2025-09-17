import { gql } from '@apollo/client';

export const GET_DOCKER_CONTAINERS = gql`
  query GetDockerContainers($skipCache: Boolean = false) {
    docker {
      id
      organizer(skipCache: $skipCache) {
        version
        views {
          id
          name
          root {
            __typename
            ... on ResolvedOrganizerFolder {
              id
              name
              type
              children {
                __typename
                ... on ResolvedOrganizerFolder {
                  id
                  name
                  type
                  children {
                    __typename
                    ... on ResolvedOrganizerFolder {
                      id
                      name
                      type
                      children {
                        __typename
                        ... on ResolvedOrganizerFolder {
                          id
                          name
                          type
                        }
                        ... on OrganizerContainerResource {
                          id
                          name
                          type
                          meta {
                            id
                            names
                            state
                            status
                            image
                            ports {
                              privatePort
                              publicPort
                              type
                            }
                            autoStart
                            hostConfig {
                              networkMode
                            }
                            created
                            isUpdateAvailable
                            isRebuildReady
                          }
                        }
                      }
                    }
                    ... on OrganizerContainerResource {
                      id
                      name
                      type
                      meta {
                        id
                        names
                        state
                        status
                        image
                        ports {
                          privatePort
                          publicPort
                          type
                        }
                        autoStart
                        hostConfig {
                          networkMode
                        }
                        created
                        isUpdateAvailable
                        isRebuildReady
                      }
                    }
                  }
                }
                ... on OrganizerContainerResource {
                  id
                  name
                  type
                  meta {
                    id
                    names
                    state
                    status
                    image
                    ports {
                      privatePort
                      publicPort
                      type
                    }
                    autoStart
                    hostConfig {
                      networkMode
                    }
                    created
                    isUpdateAvailable
                    isRebuildReady
                  }
                }
              }
            }
            ... on OrganizerContainerResource {
              id
              name
              type
              meta {
                id
                names
                state
                status
                image
                ports {
                  privatePort
                  publicPort
                  type
                }
                autoStart
                hostConfig {
                  networkMode
                }
                created
                isUpdateAvailable
                isRebuildReady
              }
            }
          }
        }
      }
    }
  }
`;
