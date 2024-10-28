export interface ApiKey {
    id: string;
    key: string;
    name: string;
    description?: string;
    roles: string[];
    createdAt: Date;
    lastUsed?: Date;
}
