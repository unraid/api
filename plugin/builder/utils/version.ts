import { $ } from "zx";

export const getVersion = () => {
  const gitSha = $.sync`git rev-parse --short HEAD`.text();
  // prettier-ignore
  const isTagged = $.sync({ nothrow: true })`git describe --tags --abbrev=0 --exact-match`.ok;
  const packageLockVersion = $.sync`jq -r '.version' package.json`.text();
  const apiVersion = isTagged
    ? packageLockVersion
    : `${packageLockVersion}+${gitSha}`;
  return {
    version: apiVersion,
    isTagged,
    gitSha,
    packageLockVersion,
  };
};
