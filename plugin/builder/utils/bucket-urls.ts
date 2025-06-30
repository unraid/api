import {
  getTxzName,
  LOCAL_BUILD_TAG,
  pluginNameWithExt,
  defaultArch,
  defaultBuild,
  TxzNameParams,
} from "./consts";

// Define a common interface for URL parameters
interface UrlParams {
  baseUrl: string;
  tag?: string;
}

interface TxzUrlParams extends UrlParams, TxzNameParams {}

/**
 * Get the bucket path for the given tag
 * ex. baseUrl = https://stable.dl.unraid.net/unraid-api
 * ex. tag = PR123
 * ex. returns = https://stable.dl.unraid.net/unraid-api/tag/PR123
 */
const getRootBucketPath = ({ baseUrl, tag }: UrlParams): URL => {
  // Append tag to the baseUrl if tag is set, otherwise return the baseUrl
  const url = new URL(baseUrl);
  if (tag && tag !== LOCAL_BUILD_TAG) {
    // Ensure the path ends with a trailing slash before adding the tag
    url.pathname = url.pathname.replace(/\/?$/, "/") + "tag/" + tag;
  }
  return url;
};

/**
 * Get the URL for an asset from the root bucket
 * ex. returns = BASE_URL/TAG/dynamix.unraid.net.plg
 */
export const getAssetUrl = (params: UrlParams, assetName: string): string => {
  const rootUrl = getRootBucketPath(params);
  rootUrl.pathname = rootUrl.pathname.replace(/\/?$/, "/") + assetName;
  return rootUrl.toString();
};
/**
 * Get the URL for the plugin file
 * ex. returns = BASE_URL/TAG/dynamix.unraid.net.plg
 */
export const getPluginUrl = (params: UrlParams): string =>
  getAssetUrl(params, pluginNameWithExt);

/**
 * Get the URL for the main TXZ file
 * ex. returns = BASE_URL/TAG/dynamix.unraid.net-4.1.3-x86_64-1.txz
 */
export const getMainTxzUrl = (params: TxzUrlParams): string =>
  getAssetUrl(params, getTxzName(params));
