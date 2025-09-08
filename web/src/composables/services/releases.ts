import type { Release } from '~/store/updateOsActions';

import { request } from '~/composables/services/request';

const ReleasesRequest = request.url('https://releases.unraid.net');

export interface GetOsReleaseBySha256Payload {
  keyfile: string;
  sha256: string;
}
export const getOsReleaseBySha256 = async (payload: GetOsReleaseBySha256Payload): Promise<Release> =>
  await ReleasesRequest.headers({
    'X-Unraid-Keyfile': payload.keyfile,
  })
    .url(`/sha256/${payload.sha256}`)
    .get()
    .json();
