export const GET_CLOUD_OBJECT = /* GraphQL */`
query getCloud {
    cloud {
        error 
        apiKey {
            valid
            error
        }
        minigraphql {
            status
            error
        }
        cloud {
            status 
            error 
            ip
        }
        allowedOrigins
        emhttp {
            mode
        }
    }
}
`;

export const GET_SERVERS = /* GraphQL */`
query getServers {
    servers {
        name
        guid
        status
        owner {
            username
        }
    }
}
`;
