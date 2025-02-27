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
 */
const getRootBucketPath = ({ baseUrl, tag }: UrlParams): URL => {
  // Append tag to the baseUrl if tag is set, otherwise return the baseUrl
  const url = new URL(baseUrl);
  if (tag) {
    // Ensure the path ends with a trailing slash before adding the tag
    url.pathname = url.pathname.replace(/\/?$/, "/") + tag;
  }
  return url;
};

/**
 * Get the URL for the plugin file
 */
export const getPluginUrl = (params: UrlParams): string => {
  const rootUrl = getRootBucketPath(params);
  // Ensure the path ends with a slash and join with the plugin name
  rootUrl.pathname = rootUrl.pathname.replace(/\/?$/, "/") + pluginNameWithExt;
  return rootUrl.toString();
};

/**
 * Get the URL for the main TXZ file
 */
export const getMainTxzUrl = (params: TxzUrlParams): string => {
  const rootUrl = getRootBucketPath(params);
  // Ensure the path ends with a slash and join with the txz name
  rootUrl.pathname = rootUrl.pathname.replace(/\/?$/, "/") + getTxzName(params.pluginVersion);
  return rootUrl.toString();
};
