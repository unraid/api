const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const readline = require('readline');
const diff = require('diff');
const crypto = require('crypto');
const chalk = require('chalk');

const CONSTANTS = {
  PATHS: {
    IGNORE_LIST: path.join(__dirname, '.sync-webgui-repo-ignored-files.json'),
    NEW_FILES: path.join(__dirname, '.sync-webgui-repo-new-files.json'),
    STATE: path.join(__dirname, '.sync-webgui-repo-state.json'),
  },
  IGNORE_PATTERNS: [/\.md$/i, /\.ico$/i, /\.cfg$/i, /\.json$/i, /^banner\.png$/i],
  PLUGIN_PATHS: {
    API: 'plugin/source/dynamix.unraid.net/usr/local/emhttp/plugins',
    WEBGUI: 'emhttp/plugins',
  },
  WEB_COMPONENTS: {
    API_PATH: 'web/.nuxt/nuxt-custom-elements/dist/unraid-components',
    WEBGUI_PATH: 'emhttp/plugins/dynamix.my.servers/unraid-components/nuxt',
  },
};

const FileSystem = {
  readJsonFile(path, defaultValue = {}) {
    try {
      return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  writeJsonFile(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  },

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  },

  copyFile(source, dest) {
    try {
      const destDir = path.dirname(dest);
      this.ensureDir(destDir);
      fs.copyFileSync(source, dest);
      return true;
    } catch (err) {
      UI.log(`Failed to copy ${source} to ${dest}: ${err.message}`, 'error');
      return false;
    }
  },

  getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  },

  copyDirectory(source, destination) {
    this.ensureDir(destination);
    fs.readdirSync(source).forEach((file) => {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);
      const stats = fs.statSync(sourcePath);

      if (stats.isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
  },
};

const UI = {
  rl: readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  }),

  async question(query) {
    return new Promise((resolve) => this.rl.question(query, resolve));
  },

  async confirm(query, defaultYes = true) {
    const answer = await this.question(`${query} (${defaultYes ? 'Y/n' : 'y/N'}) `);
    return defaultYes ? answer.toLowerCase() !== 'n' : answer.toLowerCase() === 'y';
  },

  log(message, type = 'info') {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      skip: '⏭️',
      new: '✨',
    };
    console.log(`${icons[type] || ''} ${message}`);
  },

  playSound() {
    const sounds = {
      darwin: 'afplay /System/Library/Sounds/Glass.aiff',
      linux: 'paplay /usr/share/sounds/freedesktop/stereo/complete.oga',
      win32:
        'powershell.exe -c "(New-Object Media.SoundPlayer \'C:\\Windows\\Media\\Windows Default.wav\').PlaySync()"',
    };
    const sound = sounds[process.platform];
    if (sound) require('child_process').exec(sound);
  },
};

const State = {
  loadIgnoredFiles() {
    return FileSystem.readJsonFile(CONSTANTS.PATHS.IGNORE_LIST, []);
  },

  saveIgnoredFiles(files) {
    FileSystem.writeJsonFile(CONSTANTS.PATHS.IGNORE_LIST, files);
  },

  loadPaths() {
    return FileSystem.readJsonFile(CONSTANTS.PATHS.STATE);
  },

  savePaths(paths) {
    Object.keys(paths).forEach((key) => {
      if (typeof paths[key] === 'string') {
        paths[key] = paths[key].endsWith('/') ? paths[key] : paths[key] + '/';
      }
    });
    FileSystem.writeJsonFile(CONSTANTS.PATHS.STATE, paths);
  },

  getNewFiles() {
    const data = FileSystem.readJsonFile(CONSTANTS.PATHS.NEW_FILES, { newFiles: {} });
    return data.newFiles;
  },

  saveNewFiles(files) {
    FileSystem.writeJsonFile(CONSTANTS.PATHS.NEW_FILES, {
      timestamp: new Date().toISOString(),
      newFiles: files,
    });
  },
};

const FileOps = {
  loadGitignore(dirPath) {
    const gitignorePath = path.join(dirPath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const ig = ignore();
      ig.add(fs.readFileSync(gitignorePath, 'utf8'));
      return ig;
    }
    return null;
  },

  showDiff(apiFile, webguiFile) {
    const content1 = fs.readFileSync(apiFile, 'utf8');
    const content2 = fs.readFileSync(webguiFile, 'utf8');

    const differences = diff.createPatch(
      path.basename(apiFile),
      content2,
      content1,
      'webgui version',
      'api version'
    );

    if (differences.split('\n').length > 5) {
      console.log('\nDiff for', chalk.cyan(path.basename(apiFile)));
      console.log(chalk.red('--- webgui:'), webguiFile);
      console.log(chalk.green('+++ api:  '), apiFile);

      differences
        .split('\n')
        .slice(5)
        .forEach((line) => {
          if (line.startsWith('+')) console.log(chalk.green(line));
          else if (line.startsWith('-')) console.log(chalk.red(line));
          else if (line.startsWith('@')) console.log(chalk.cyan(line));
          else console.log(line);
        });
      return true;
    }
    return false;
  },

  async handleFileDiff(apiFile, webguiFile) {
    if (!this.showDiff(apiFile, webguiFile)) return 'identical';

    const answer = await UI.question(
      'What should I do fam? (w=copy to webgui/a=copy to API/s=skip) '
    );
    switch (answer.toLowerCase()) {
      case 'w':
        return FileSystem.copyFile(apiFile, webguiFile) ? 'webgui' : 'error';
      case 'a':
        return FileSystem.copyFile(webguiFile, apiFile) ? 'api' : 'error';
      default:
        return 'skip';
    }
  },

  walkDirectory(currentPath, baseDir, projectFiles, gitignoreRules) {
    const files = fs.readdirSync(currentPath);

    files.forEach((file) => {
      if (file.startsWith('.')) return;

      const fullPath = path.join(currentPath, file);
      const relativePath = path.relative(baseDir, fullPath);

      if (relativePath.includes('test') || relativePath.includes('tests')) return;
      if (CONSTANTS.IGNORE_PATTERNS.some((pattern) => pattern.test(file))) return;
      if (gitignoreRules?.ignores(relativePath)) return;

      const lstat = fs.lstatSync(fullPath);
      if (lstat.isSymbolicLink()) return;

      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        this.walkDirectory(fullPath, baseDir, projectFiles, gitignoreRules);
      } else {
        if (!projectFiles.has(file)) {
          projectFiles.set(file, []);
        }
        projectFiles.get(file).push(fullPath);
      }
    });
  },
};

const Features = {
  async setupPaths() {
    const paths = State.loadPaths();
    let changed = false;

    if (
      !paths.apiProjectDir ||
      !(await UI.confirm(`Use last API repo path (${paths.apiProjectDir})?`))
    ) {
      paths.apiProjectDir = await UI.question('Enter the path to your API repo: ');
      changed = true;
    }

    if (
      !paths.webguiProjectDir ||
      !(await UI.confirm(`Use last webgui repo path (${paths.webguiProjectDir})?`))
    ) {
      paths.webguiProjectDir = await UI.question('Enter the path to your webgui repo: ');
      changed = true;
    }

    if (changed) {
      State.savePaths(paths);
    }

    return paths;
  },

  async handleWebComponentBuild() {
    const webDir = path.join(global.apiProjectDir, 'web');
    if (!fs.existsSync(webDir)) {
      UI.log('Web directory not found in API repo!', 'error');
      return;
    }

    UI.log('Building web components...', 'info');
    const { exec } = require('child_process');

    try {
      await new Promise((resolve, reject) => {
        const buildProcess = exec('pnpm run build', { cwd: webDir });

        buildProcess.stdout.on('data', (data) => process.stdout.write(data));
        buildProcess.stderr.on('data', (data) => process.stderr.write(data));

        buildProcess.on('exit', (code) => {
          if (code === 0) {
            UI.log('Build completed successfully!', 'success');
            resolve();
          } else {
            reject(new Error(`Build failed with code ${code}`));
          }
        });
      });
    } catch (err) {
      UI.log(`Error during build: ${err.message}`, 'error');
    }
  },

  async handleWebComponentSync() {
    const apiPath = path.join(global.apiProjectDir, CONSTANTS.WEB_COMPONENTS.API_PATH);
    const webguiPath = path.join(global.webguiProjectDir, CONSTANTS.WEB_COMPONENTS.WEBGUI_PATH);

    try {
      if (!fs.existsSync(apiPath)) {
        UI.log('Source directory not found! Did you build the web components?', 'error');
        return;
      }

      UI.log('Removing old _nuxt directory...', 'info');
      fs.rmSync(`${webguiPath}/_nuxt`, { recursive: true, force: true });

      UI.log('Copying new files...', 'info');
      FileSystem.copyDirectory(apiPath, webguiPath);

      const indexPath = path.join(webguiPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        UI.log('Removing irrelevant index.html...', 'info');
        fs.unlinkSync(indexPath);
      }

      UI.playSound();
      UI.log('Files copied successfully!', 'success');
    } catch (err) {
      UI.log(`Error during sync: ${err.message}`, 'error');
    }
  },

  findMatchingFiles(apiProjectDir, webguiProjectDir) {
    const matches = new Map();
    const apiFiles = new Map();
    const webguiFiles = new Map();

    const gitignore1 = FileOps.loadGitignore(apiProjectDir);
    const gitignore2 = FileOps.loadGitignore(webguiProjectDir);

    FileOps.walkDirectory(apiProjectDir, apiProjectDir, apiFiles, gitignore1);
    FileOps.walkDirectory(webguiProjectDir, webguiProjectDir, webguiFiles, gitignore2);

    apiFiles.forEach((paths1, filename) => {
      if (webguiFiles.has(filename)) {
        matches.set(filename, [...paths1, ...webguiFiles.get(filename)]);
      }
    });

    return matches;
  },

  findMissingPluginFiles(apiProjectDir, webguiProjectDir, ignoredFiles) {
    const missingFiles = new Map();

    if (!apiProjectDir || !webguiProjectDir) {
      UI.log('API project and webgui project directories are required!', 'error');
      return missingFiles;
    }

    const apiPluginsPath = path.join(apiProjectDir, CONSTANTS.PLUGIN_PATHS.API);
    const webguiPluginsPath = path.join(webguiProjectDir, CONSTANTS.PLUGIN_PATHS.WEBGUI);

    if (!fs.existsSync(apiPluginsPath)) {
      UI.log('API plugins directory not found: ' + apiPluginsPath, 'error');
      return missingFiles;
    }

    const gitignore1 = FileOps.loadGitignore(apiProjectDir);

    function walkDir(currentPath, baseDir) {
      if (!fs.existsSync(currentPath)) {
        UI.log(`Directory doesn't exist: ${currentPath}`, 'warning');
        return;
      }

      UI.log(`Checking directory: ${path.relative(apiProjectDir, currentPath)}`, 'info');

      fs.readdirSync(currentPath).forEach((file) => {
        if (file.startsWith('.')) {
          UI.log(`Skipping dot file/dir: ${file}`, 'skip');
          return;
        }

        const fullPath = path.join(currentPath, file);
        const relativePath = path.relative(apiPluginsPath, fullPath);

        if (CONSTANTS.IGNORE_PATTERNS.some((pattern) => pattern.test(file))) {
          UI.log(`Skipping ignored pattern: ${file}`, 'skip');
          return;
        }

        if (gitignore1?.ignores(relativePath)) {
          UI.log(`Skipping gitignored file: ${file}`, 'skip');
          return;
        }

        const lstat = fs.lstatSync(fullPath);
        if (lstat.isSymbolicLink()) {
          UI.log(`Skipping symlink: ${file}`, 'skip');
          return;
        }

        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          UI.log(`Found subdirectory: ${file}`, 'info');
          walkDir(fullPath, baseDir);
          return;
        }

        if (ignoredFiles.includes(file)) {
          UI.log(`Skipping manually ignored file: ${file}`, 'skip');
          return;
        }

        const webguiPath = path.join(webguiPluginsPath, relativePath);
        if (!fs.existsSync(webguiPath)) {
          UI.log(`Found new file: ${relativePath}`, 'new');
          missingFiles.set(relativePath, {
            source: fullPath,
            destinationPath: webguiPath,
            relativePath,
          });
        } else {
          UI.log(`File exists in both: ${relativePath}`, 'success');
        }
      });
    }

    UI.log('\nStarting directory scan...', 'info');
    UI.log(`API plugins path: ${apiPluginsPath}`, 'info');
    UI.log(`Webgui plugins path: ${webguiPluginsPath}\n`, 'info');

    try {
      walkDir(apiPluginsPath, apiPluginsPath);
      if (missingFiles.size > 0) {
        State.saveNewFiles(
          Object.fromEntries(
            Array.from(missingFiles).map(([relativePath, info]) => [relativePath, info])
          )
        );
      }
    } catch (err) {
      UI.log(`Error while scanning directories: ${err.message}`, 'error');
    }

    return missingFiles;
  },

  async handleNewFiles() {
    const newFiles = State.getNewFiles();
    const fileCount = Object.keys(newFiles).length;

    if (fileCount === 0) {
      UI.log('No new files to copy bruv!', 'info');
      return;
    }

    UI.log(`Found ${fileCount} files to review:`, 'info');

    const handledFiles = new Set();
    const ignoredFiles = State.loadIgnoredFiles();

    for (const [relativePath, info] of Object.entries(newFiles)) {
      console.log(`\nFile: ${relativePath}`);
      console.log(`From: ${info.source}`);
      console.log(`To: ${info.destinationPath}`);

      const answer = await UI.question(
        'What should I do fam? (w=copy to webgui/i=ignore forever/s=skip/q=quit) '
      );

      switch (answer.toLowerCase()) {
        case 'w':
          if (FileSystem.copyFile(info.source, info.destinationPath)) {
            UI.log(`Copied: ${relativePath}`, 'success');
            handledFiles.add(relativePath);
          }
          break;

        case 'i':
          ignoredFiles.push(path.basename(relativePath));
          State.saveIgnoredFiles(ignoredFiles);
          UI.log(`Added ${path.basename(relativePath)} to ignore list`, 'info');
          handledFiles.add(relativePath);
          break;

        case 'q':
          UI.log('Stopping here fam!', 'info');
          break;

        default:
          UI.log(`Skipped: ${relativePath}`, 'skip');
          handledFiles.add(relativePath);
          break;
      }

      if (answer.toLowerCase() === 'q') break;
    }

    const updatedNewFiles = Object.fromEntries(
      Object.entries(newFiles).filter(([relativePath]) => !handledFiles.has(relativePath))
    );

    State.saveNewFiles(updatedNewFiles);

    const remainingCount = Object.keys(updatedNewFiles).length;
    UI.log('All done for now bruv! 🔥', 'success');
    if (remainingCount > 0) {
      UI.log(`${remainingCount} files left to handle next time.`, 'info');
    }
  },
};

const Menu = {
  async show() {
    while (true) { // Keep showing menu until exit
      try {
        console.log('\nWhat you trying to do fam?');
        console.log('1. Find new plugin files in API project');
        console.log('2. Handle new plugin files in API project');
        console.log('3. Sync shared files between API and webgui');
        console.log('4. Build web components');
        console.log('5. Sync web components');
        console.log('6. Exit\n');

        const answer = await UI.question('Choose an option (1-6): ');

        switch (answer) {
          case '1': {
            UI.log('Checking plugin directories for missing files bruv...', 'info');
            const ignoredFiles = State.loadIgnoredFiles();
            const missingFiles = Features.findMissingPluginFiles(
              global.apiProjectDir,
              global.webguiProjectDir,
              ignoredFiles
            );

            if (missingFiles.size > 0) {
              UI.log(`Found ${missingFiles.size} new files! 🔍`, 'info');
              if (await UI.confirm('Want to handle these new files now fam?', false)) {
                await Features.handleNewFiles();
              } else {
                UI.log('Safe, you can handle them later with option 2!', 'info');
              }
            } else {
              UI.log('No new files found bruv! 👌', 'success');
            }
            break;
          }

          case '2':
            await Features.handleNewFiles();
            break;

          case '3': {
            UI.log('Checking for matching files bruv...', 'info');
            const matchingFiles = Features.findMatchingFiles(
              global.apiProjectDir,
              global.webguiProjectDir
            );

            if (matchingFiles.size === 0) {
              UI.log('No matching files found fam!', 'info');
            } else {
              UI.log(`Found ${matchingFiles.size} matching files:\n`, 'info');

              for (const [filename, paths] of matchingFiles) {
                const [apiPath, webguiPath] = paths;
                console.log(`File: ${filename}`);

                const apiHash = FileSystem.getFileHash(apiPath);
                const webguiHash = FileSystem.getFileHash(webguiPath);

                if (apiHash !== webguiHash) {
                  await FileOps.handleFileDiff(apiPath, webguiPath);
                } else {
                  UI.log('Files are identical', 'success');
                }
                console.log('');
              }
            }
            break;
          }

          case '4':
            await Features.handleWebComponentBuild();
            break;

          case '5':
            await Features.handleWebComponentSync();
            break;

          case '6':
            UI.log('Safe bruv, catch you later! 👋', 'success');
            UI.rl.close();
            process.exit(0);
            return; // Exit the loop

          default:
            UI.log("Nah fam, that's not a valid option!", 'error');
            break;
        }
      } catch (error) {
        UI.log(error.message, 'error');
        UI.rl.close();
        process.exit(1);
      }
    }
  }
};

const App = {
  async init() {
    try {
      const paths = await Features.setupPaths();
      global.apiProjectDir = paths.apiProjectDir;
      global.webguiProjectDir = paths.webguiProjectDir;
      await Menu.show();
    } catch (error) {
      UI.log(error.message, 'error');
      UI.rl.close();
      process.exit(1);
    }
  },
};

App.init().catch((error) => {
  UI.log(`Something went wrong fam: ${error.message}`, 'error');
  UI.rl.close();
  process.exit(1);
});
