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
            timeout
            error
        }
        cloud {
            status 
            error 
            ip
        }
        allowedOrigins
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
