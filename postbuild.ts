// type Manifest = {
//   ['connect-components.client.css']: ManifestCSS;
//   ['connect-components.client.mjs']: ManifestJS;
// }

// type ManifestCSS = {
//   file: string;
//   src: string;
// }

// type ManifestJS = {
//   css: string[];
//   file: string;
//   isEntry: boolean;
//   src: string;
// }

const fs = require('fs');

const manifest = '.nuxt/nuxt-custom-elements/dist/connect-components/manifest.json';
const stringToRemove = '.nuxt/nuxt-custom-elements/entries/';

const originalCssKey = '.nuxt/nuxt-custom-elements/entries/connect-components.client.css';
const originalJsKey = '.nuxt/nuxt-custom-elements/entries/connect-components.client.mjs';

console.log('*****************************');
console.log('* RE-BUILDING MANIFEST.JSON *');
console.log('*****************************');

fs.readFile(manifest, 'utf8', (error, data) => {
  if (error){
    console.log(error);
    return;
  }
  const parsedData = JSON.parse(data);

  if ('connect-components.client.mjs' in parsedData) return console.log('Manifest already re-written');
  if (!(originalJsKey in parsedData)) return console.error(`Expected JS key not in ${manifest}`);

  // create new manifest with updated top-level keys
  const newManifest = {
    'connect-components.client.css': {
      ...parsedData[originalCssKey],
    },
    'connect-components.client.mjs': {
      ...parsedData[originalJsKey],
    }
  };
  // then rewrite the manifest
  fs.writeFile(manifest, JSON.stringify(newManifest, null, 2), (err) => {
    if (err) {
      console.log('Failed to write updated data to file', err);
      return;
    }
    console.log('Updated file successfully');
  });
  // echo out the filename that needs to be created on the server
  const map = new Map(Object.entries(newManifest));
  const js = map.get('connect-components.client.mjs');
  console.log(`JS FILE FOR WEBGUI: ${js.file}`);
});