export const GET_REPORT_OBJECT = /* GraphQL */`
query {
    cloud {
        error 
        apiKey {
            valid
        }
        minigraphql {
            status
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
