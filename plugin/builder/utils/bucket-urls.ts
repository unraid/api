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
  const url = new URL(pluginNameWithExt, rootUrl);
  return url.toString();
};

/**
 * Get the URL for the main TXZ file
 */
export const getMainTxzUrl = (params: TxzUrlParams): string => {
  const rootUrl = getRootBucketPath(params);
  const url = new URL(getTxzName(params.pluginVersion), rootUrl);
  return url.toString();
};
