import { Static, String } from 'runtypes';

export const apiKey = String.withBrand('api-key');
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentionally naming the variable the same as the type
export type apiKey = Static<typeof apiKey>;
