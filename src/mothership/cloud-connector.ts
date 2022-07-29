export class CloudConnector {
    public static instance: CloudConnector
    private isRunning: boolean

    constructor() {
        if (CloudConnector.instance) {
            return CloudConnector.instance
        } 
        CloudConnector.instance = this
    }
}

