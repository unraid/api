import { getTxzName, pluginNameWithExt } from "./consts";

// Define a common interface for URL parameters
interface UrlParams {
  baseUrl: string;
  tag?: string;
}

interface TxzUrlParams extends UrlParams {
  pluginVersion: string;
}

/**
 * Get the bucket path for the given tag
 * ex. baseUrl = https://stable.dl.unraid.net/unraid-api
 * ex. tag = PR123
 * ex. returns = https://stable.dl.unraid.net/unraid-api/tag/PR123
 */
const getRootBucketPath = ({ baseUrl, tag }: UrlParams): URL => {
  // Append tag to the baseUrl if tag is set, otherwise return the baseUrl
  const url = new URL(baseUrl);
  if (tag) {
    // Ensure the path ends with a trailing slash before adding the tag
    url.pathname = url.pathname.replace(/\/?$/, "/") + "tag/" + tag;
  }
  return url;
};

/**
 * Get the URL for the plugin file
 * ex. returns = BASE_URL/TAG/dynamix.unraid.net.plg
 */
export const getPluginUrl = (params: UrlParams): string => {
  const rootUrl = getRootBucketPath(params);
  // Ensure the path ends with a slash and join with the plugin name
  rootUrl.pathname = rootUrl.pathname.replace(/\/?$/, "/") + pluginNameWithExt;
  return rootUrl.toString();
};

/**
 * Get the URL for the main TXZ file
 * ex. returns = BASE_URL/TAG/dynamix.unraid.net-4.1.3.txz
 */
export const getMainTxzUrl = (params: TxzUrlParams): string => {
  const rootUrl = getRootBucketPath(params);
  // Ensure the path ends with a slash and join with the txz name
  rootUrl.pathname = rootUrl.pathname.replace(/\/?$/, "/") + getTxzName(params.pluginVersion);
  return rootUrl.toString();
};
