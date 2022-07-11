import { Static, String } from 'runtypes';

export const apiKey = String.withBrand('api-key');
export type apiKey = Static<typeof apiKey>;
