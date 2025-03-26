const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const readline = require('readline');
const diff = require('diff');
const crypto = require('crypto'); // for file comparison
const chalk = require('chalk'); // Add at top with other requires

// Add these functions near the top with the other helpers
function loadIgnoredFiles() {
    try {
        return fs.existsSync(IGNORE_LIST_FILE) 
            ? JSON.parse(fs.readFileSync(IGNORE_LIST_FILE, 'utf8')) 
            : [];
    } catch (err) {
        return [];
    }
}

function saveIgnoredFiles(ignoredFiles) {
    fs.writeFileSync(IGNORE_LIST_FILE, JSON.stringify(ignoredFiles, null, 2));
}

const IGNORE_LIST_FILE = path.join(__dirname, '.sync-webgui-repo-ignored-files.json');
const NEW_FILES_JSON = path.join(__dirname, '.sync-webgui-repo-new-files.json');
const STATE_FILE = path.join(__dirname, '.sync-webgui-repo-state.json');

function loadGitignore(dirPath) {
    const gitignorePath = path.join(dirPath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const ig = ignore();
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        ig.add(gitignoreContent);
        return ig;
    }
    return null;
}

function findMatchingFiles(apiProjectDir, webguiProjectDir) {
    const matches = new Map();
    const apiFiles = new Map();
    const webguiFiles = new Map();

    // Define files and patterns to ignore
    const ignorePatterns = [
        /\.md$/i,          // Markdown files
        /\.ico$/i,         // Icon files
        /\.cfg$/i,         // Config files
        /\.json$/i,        // JSON files
        /^banner\.png$/i,  // banner.png files
    ];

    // Load .gitignore rules for both projects
    const gitignore1 = loadGitignore(apiProjectDir);
    const gitignore2 = loadGitignore(webguiProjectDir);

    function walkDir(currentPath, baseDir, projectFiles, gitignoreRules) {
        const files = fs.readdirSync(currentPath);
        
        files.forEach(file => {
            // Skip dot directories
            if (file.startsWith('.')) {
                return;
            }

            const fullPath = path.join(currentPath, file);
            const relativePath = path.relative(baseDir, fullPath);

            // Skip test directories
            if (relativePath.includes('test') || relativePath.includes('tests')) {
                return;
            }

            // Check if file matches any ignore patterns
            if (ignorePatterns.some(pattern => pattern.test(file))) {
                return;
            }

            // Check if file is ignored by .gitignore
            if (gitignoreRules && gitignoreRules.ignores(relativePath)) {
                return;
            }
            
            const lstat = fs.lstatSync(fullPath);
            if (lstat.isSymbolicLink()) {
                return;
            }

            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                walkDir(fullPath, baseDir, projectFiles, gitignoreRules);
            } else {
                if (!projectFiles.has(file)) {
                    projectFiles.set(file, []);
                }
                projectFiles.get(file).push(fullPath);
            }
        });
    }

    // Walk each project separately
    walkDir(apiProjectDir, apiProjectDir, apiFiles, gitignore1);
    walkDir(webguiProjectDir, webguiProjectDir, webguiFiles, gitignore2);

    // Find files that exist in both projects
    apiFiles.forEach((paths1, filename) => {
        if (webguiFiles.has(filename)) {
            matches.set(filename, [...paths1, ...webguiFiles.get(filename)]);
        }
    });

    return matches;
}

// Add this helper function for file comparison
function getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

// Update the helper function for showing diffs
function showDiff(apiFile, webguiFile) {
    const content1 = fs.readFileSync(apiFile, 'utf8');
    const content2 = fs.readFileSync(webguiFile, 'utf8');
    
    // Create patch with correct file labels
    const differences = diff.createPatch(
        path.basename(apiFile),
        content2,
        content1,
        'webgui version',
        'api version'
    );
    
    // Only show diff if files are different
    if (differences.split('\n').length > 5) {
        console.log('\nDiff for', chalk.cyan(path.basename(apiFile)));
        console.log(chalk.red('--- webgui:'), webguiFile);
        console.log(chalk.green('+++ api:  '), apiFile);
        
        // Colorize the diff output
        const lines = differences.split('\n').slice(5); // Skip the header
        lines.forEach(line => {
            if (line.startsWith('+')) {
                console.log(chalk.green(line));
            } else if (line.startsWith('-')) {
                console.log(chalk.red(line));
            } else if (line.startsWith('@')) {
                console.log(chalk.cyan(line));
            } else {
                console.log(line);
            }
        });
        return true;
    }
    return false;
}

// Create a single readline interface for the whole program
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Simplify the question helper
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Add these helper functions near the other helpers
function loadLastWebguiPath() {
    try {
        return fs.existsSync(STATE_FILE) 
            ? fs.readFileSync(STATE_FILE, 'utf8').trim()
            : '';
    } catch (err) {
        return '';
    }
}

function saveWebguiPath(path) {
    fs.writeFileSync(STATE_FILE, path);
}

// Add this helper function for recursive directory copying
function copyDirectory(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const files = fs.readdirSync(source);

    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);

        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    });
}

// Update the state file to store all paths
function loadPaths() {
    try {
        return fs.existsSync(STATE_FILE) 
            ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
            : {};
    } catch (err) {
        return {};
    }
}

function savePaths(paths) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(paths, null, 2));
}

// Add this function to handle path prompts
async function setupPaths() {
    const paths = loadPaths();
    let changed = false;

    // Handle API repo path
    if (!paths.apiProjectDir) {
        paths.apiProjectDir = await question('Enter the path to your API repo: ');
        changed = true;
    } else {
        const useLastPath = await question(`Use last API repo path (${paths.apiProjectDir})? (Y/n) `);
        if (useLastPath.toLowerCase() === 'n') {
            paths.apiProjectDir = await question('Enter new API repo path: ');
            changed = true;
        }
    }

    // Handle webgui repo path
    if (!paths.webguiProjectDir) {
        paths.webguiProjectDir = await question('Enter the path to your webgui repo: ');
        changed = true;
    } else {
        const useLastPath = await question(`Use last webgui repo path (${paths.webguiProjectDir})? (Y/n) `);
        if (useLastPath.toLowerCase() === 'n') {
            paths.webguiProjectDir = await question('Enter new webgui repo path: ');
            changed = true;
        }
    }

    // Ensure paths end with slash
    paths.apiProjectDir = paths.apiProjectDir.endsWith('/') ? paths.apiProjectDir : paths.apiProjectDir + '/';
    paths.webguiProjectDir = paths.webguiProjectDir.endsWith('/') ? paths.webguiProjectDir : paths.webguiProjectDir + '/';
    // Use same path for webgui
    paths.webguiProjectDir = paths.webguiProjectDir;

    if (changed) {
        savePaths(paths);
    }

    return paths;
}

// Update the start of the program
async function init() {
    try {
        const paths = await setupPaths();
        // Make these available globally
        global.apiProjectDir = paths.apiProjectDir;
        global.webguiProjectDir = paths.webguiProjectDir;
        await showMenu();
    } catch (error) {
        console.error('Error during initialization:', error);
        rl.close();
        process.exit(1);
    }
}

// Update handleNuxtSync to handleWebComponentSync
async function handleWebComponentSync() {
    const apiWebComponentsPath = `${global.apiProjectDir}web/.nuxt/nuxt-custom-elements/dist/unraid-components`;
    const webguiWebComponentsPath = `${global.webguiProjectDir}emhttp/plugins/dynamix.my.servers/unraid-components`;

    try {
        // Check if source exists
        if (!fs.existsSync(apiWebComponentsPath)) {
            console.error('❌ Source directory not found! Did you build the web components?');
            return;
        }

        console.log('Removing old _nuxt directory...');
        fs.rmSync(`${webguiWebComponentsPath}/_nuxt`, { recursive: true, force: true });

        console.log('Copying new files...');
        copyDirectory(apiWebComponentsPath, webguiWebComponentsPath);

        // Remove index.html if it exists
        const indexPath = path.join(webguiWebComponentsPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            console.log('Removing irrelevant index.html...');
            fs.unlinkSync(indexPath);
        }

        // Play sound based on OS
        const { platform } = process;
        switch (platform) {
            case 'darwin':
                require('child_process').exec('afplay /System/Library/Sounds/Glass.aiff');
                break;
            case 'linux':
                require('child_process').exec('paplay /usr/share/sounds/freedesktop/stereo/complete.oga');
                break;
            case 'win32':
                require('child_process').exec('powershell.exe -c "(New-Object Media.SoundPlayer \'C:\\Windows\\Media\\Windows Default.wav\').PlaySync()"');
                break;
        }

        console.log('✅ Files copied successfully!');
    } catch (err) {
        console.error('❌ Error during sync:', err.message);
    }
}

// Update handleNuxtBuild to handleWebComponentBuild
async function handleWebComponentBuild() {
    try {
        const webDir = path.join(global.apiProjectDir, 'web');
        if (!fs.existsSync(webDir)) {
            console.error('❌ Web directory not found in API repo!');
            return;
        }

        console.log('Building web components...');
        const { exec } = require('child_process');
        
        // Run the build command from the web directory
        const buildProcess = exec('pnpm run build', { cwd: webDir });

        // Stream the output
        buildProcess.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        buildProcess.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        // Wait for the build to complete
        await new Promise((resolve, reject) => {
            buildProcess.on('exit', (code) => {
                if (code === 0) {
                    console.log('✅ Build completed successfully!');
                    resolve();
                } else {
                    console.error(`❌ Build failed with code ${code}`);
                    reject(new Error(`Build failed with code ${code}`));
                }
            });
        });
    } catch (err) {
        console.error('❌ Error during build:', err.message);
    }
}

// Update the menu to include the build option
async function showMenu() {
    try {
        console.log('\nWhat you trying to do fam?');
        console.log('1. Check for missing plugin files');
        console.log('2. Handle new files');
        console.log('3. Check for matching files between API and webgui');
        console.log('4. Build web components');
        console.log('5. Sync web components');
        console.log('6. Exit\n');

        const answer = await question('Choose an option (1-6): ');

        switch(answer) {
            case '1': {
                console.log('Checking plugin directories for missing files bruv...\n');
                try {
                    const ignoredFiles = loadIgnoredFiles();
                    const missingFiles = findMissingPluginFiles(global.apiProjectDir, global.webguiProjectDir, ignoredFiles);

                    if (!missingFiles) {
                        console.error('❌ Failed to check for missing files!');
                    } else if (missingFiles.size > 0) {
                        console.log(`\nFound ${missingFiles.size} new files! 🔍`);
                        try {
                            const handleNow = await question('\nWant to handle these new files now fam? (y/N) ');
                            if (handleNow.toLowerCase() === 'y') {
                                await handleNewFiles();
                            } else {
                                console.log('\nSafe, you can handle them later with option 2!');
                            }
                        } catch (err) {
                            console.error('❌ Error handling user input:', err.message);
                        }
                    } else {
                        console.log('\nNo new files found bruv! 👌');
                    }
                } catch (err) {
                    console.error('❌ Something went wrong fam:', err.message);
                }
                await showMenu();
                break;
            }

            case '2':
                await handleNewFiles();
                await showMenu();
                break;

            case '3':
                console.log('Checking for matching files bruv...\n');
                const matchingFiles = findMatchingFiles(global.apiProjectDir, global.webguiProjectDir);
                
                if (matchingFiles.size === 0) {
                    console.log('No matching files found fam!');
                } else {
                    console.log(`Found ${matchingFiles.size} matching files:\n`);
                    
                    for (const [filename, paths] of matchingFiles) {
                        const [apiPath, webguiPath] = paths;
                        console.log(`File: ${filename}`);
                        
                        // Compare files using hash
                        const apiHash = getFileHash(apiPath);
                        const webguiHash = getFileHash(webguiPath);
                        
                        if (apiHash !== webguiHash) {
                            console.log('⚠️  Files are different!');
                            showDiff(apiPath, webguiPath);
                            
                            const answer = await question('What should I do fam? (a=copy from API to webgui/w=copy from webgui to API/n=skip) ');
                            switch(answer.toLowerCase()) {
                                case 'a':
                                    try {
                                        fs.copyFileSync(apiPath, webguiPath);
                                        console.log('✅ Copied API version to webgui');
                                    } catch (err) {
                                        console.error('❌ Failed to copy:', err.message);
                                    }
                                    break;
                                case 'w':
                                    try {
                                        fs.copyFileSync(webguiPath, apiPath);
                                        console.log('✅ Copied webgui version to API');
                                    } catch (err) {
                                        console.error('❌ Failed to copy:', err.message);
                                    }
                                    break;
                                default:
                                    console.log('⏭️  Skipped');
                            }
                        } else {
                            console.log('✅ Files are identical');
                        }
                        console.log(''); // Empty line for spacing
                    }
                }
                
                await showMenu();
                break;

            case '4':
                await handleWebComponentBuild();
                await showMenu();
                break;

            case '5':
                await handleWebComponentSync();
                await showMenu();
                break;

            case '6':
                console.log('Safe bruv, catch you later! 👋');
                rl.close();
                process.exit(0);
                break;

            default:
                console.log('Nah fam, that\'s not a valid option!');
                await showMenu();
                break;
        }
    } catch (error) {
        console.error('Error:', error);
        rl.close();
        process.exit(1);
    }
}

// Start the program
init().catch(error => {
    console.error('Ay fam, something went wrong:', error.message);
    rl.close();
    process.exit(1);
});

function findMissingPluginFiles(apiProjectDir, webguiProjectDir, ignoredFiles) {
    const missingFiles = new Map();
    
    // Validate inputs
    if (!apiProjectDir || !webguiProjectDir) {
        console.error('❌ API project and webgui project directories are required!');
        return missingFiles;
    }

    // Define the specific paths we're comparing
    const apiPluginsPath = path.join(apiProjectDir, 'plugin/source/dynamix.unraid.net/usr/local/emhttp/plugins');
    const webguiPluginsPath = path.join(webguiProjectDir, 'emhttp/plugins');

    // Check if API plugins directory exists
    if (!fs.existsSync(apiPluginsPath)) {
        console.error('❌ API plugins directory not found:', apiPluginsPath);
        return missingFiles;
    }

    // Use the same ignore patterns as findMatchingFiles
    const ignorePatterns = [
        /\.md$/i,          // Markdown files
        /\.ico$/i,         // Icon files
        /\.cfg$/i,         // Config files
        /\.json$/i,        // JSON files
        /^banner\.png$/i,  // banner.png files
    ];

    // Load .gitignore rules
    const gitignore1 = loadGitignore(apiProjectDir);
    const gitignore2 = loadGitignore(webguiProjectDir);

    function walkDir(currentPath, baseDir) {
        if (!fs.existsSync(currentPath)) {
            console.log(`⚠️  Directory doesn't exist: ${currentPath}`);
            return;
        }

        console.log(`🔍 Checking directory: ${path.relative(apiProjectDir, currentPath)}`);
        const files = fs.readdirSync(currentPath);
        
        files.forEach(file => {
            if (file.startsWith('.')) {
                console.log(`  ⏭️  Skipping dot file/dir: ${file}`);
                return;
            }
            
            const fullPath = path.join(currentPath, file);
            const relativePath = path.relative(apiPluginsPath, fullPath);
            
            // Check if file matches any ignore patterns
            if (ignorePatterns.some(pattern => pattern.test(file))) {
                console.log(`  ⏭️  Skipping ignored pattern: ${file}`);
                return;
            }

            // Check if file is ignored by .gitignore
            if (gitignore1 && gitignore1.ignores(relativePath)) {
                console.log(`  ⏭️  Skipping gitignored file: ${file}`);
                return;
            }
            
            const lstat = fs.lstatSync(fullPath);
            if (lstat.isSymbolicLink()) {
                console.log(`  ⏭️  Skipping symlink: ${file}`);
                return;
            }
            
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                // Recursively check subdirectories
                console.log(`  📁 Found subdirectory: ${file}`);
                walkDir(fullPath, baseDir);
                return;
            }

            // Skip manually ignored files
            if (ignoredFiles.includes(file)) {
                console.log(`  ⏭️  Skipping manually ignored file: ${file}`);
                return;
            }

            // Check if file exists in webgui plugins directory
            const webguiPath = path.join(webguiPluginsPath, relativePath);
            if (!fs.existsSync(webguiPath)) {
                console.log(`  ✨ Found new file: ${relativePath}`);
                missingFiles.set(relativePath, {
                    source: fullPath,
                    destinationPath: webguiPath,
                    relativePath
                });
            } else {
                console.log(`  ✅ File exists in both: ${relativePath}`);
            }
        });
    }

    // Only walk if the API plugins directory exists
    console.log('\nStarting directory scan...');
    console.log(`API plugins path: ${apiPluginsPath}`);
    console.log(`Webgui plugins path: ${webguiPluginsPath}\n`);

    try {
        walkDir(apiPluginsPath, apiPluginsPath);

        // Save results to NEW_FILES_JSON
        if (missingFiles.size > 0) {
            try {
                const results = {
                    timestamp: new Date().toISOString(),
                    newFiles: Object.fromEntries(
                        Array.from(missingFiles).map(([relativePath, info]) => [
                            relativePath,
                            {
                                source: info.source,
                                destinationPath: info.destinationPath,
                                relativePath: info.relativePath
                            }
                        ])
                    )
                };

                fs.writeFileSync(NEW_FILES_JSON, JSON.stringify(results, null, 2));
                console.log(`\nNew files list saved to: ${NEW_FILES_JSON}`);
            } catch (err) {
                console.error('❌ Failed to save new files list:', err.message);
            }
        }
    } catch (err) {
        console.error('❌ Error while scanning directories:', err.message);
    }

    return missingFiles;
}

async function handleNewFiles() {
    if (!fs.existsSync(NEW_FILES_JSON)) {
        console.log('No new files found bruv! Run option 1 first to find them.');
        return;
    }

    try {
        const results = JSON.parse(fs.readFileSync(NEW_FILES_JSON, 'utf8'));
        if (!results.newFiles) {
            console.log('No new files found bruv! Run option 1 first to find them.');
            return;
        }

        const newFiles = results.newFiles;
        const fileCount = Object.keys(newFiles).length;

        if (fileCount === 0) {
            console.log('No new files to copy bruv!');
            return;
        }

        console.log(`\nFound ${fileCount} files to review:`);
        
        const handledFiles = new Set();
        const ignoredFiles = loadIgnoredFiles();

        for (const [relativePath, info] of Object.entries(newFiles)) {
            console.log(`\nFile: ${relativePath}`);
            console.log(`From: ${info.source}`);
            console.log(`To: ${info.destinationPath}`);
            
            const answer = await question('What should I do fam? (y=copy/n=skip/i=ignore forever/q=quit) ');
            
            switch(answer.toLowerCase()) {
                case 'y':
                    try {
                        const destDir = path.dirname(info.destinationPath);
                        if (!fs.existsSync(destDir)) {
                            fs.mkdirSync(destDir, { recursive: true });
                        }
                        fs.copyFileSync(info.source, info.destinationPath);
                        console.log(`✅ Copied: ${relativePath}`);
                        handledFiles.add(relativePath);
                    } catch (err) {
                        console.error(`❌ Failed to copy ${relativePath}: ${err.message}`);
                    }
                    break;

                case 'i':
                    ignoredFiles.push(path.basename(relativePath));
                    saveIgnoredFiles(ignoredFiles);
                    console.log(`🚫 Added ${path.basename(relativePath)} to ignore list`);
                    handledFiles.add(relativePath);
                    break;

                case 'q':
                    console.log('\nAight, stopping here fam!');
                    break;

                default: // 'n' or any other input
                    console.log(`⏭️  Skipped: ${relativePath}`);
                    handledFiles.add(relativePath);
                    break;
            }

            if (answer.toLowerCase() === 'q') break;
        }

        // Update the new files list, removing handled files
        const updatedNewFiles = {};
        Object.entries(newFiles).forEach(([relativePath, info]) => {
            if (!handledFiles.has(relativePath)) {
                updatedNewFiles[relativePath] = info;
            }
        });

        // Save updated list
        fs.writeFileSync(
            NEW_FILES_JSON, 
            JSON.stringify(
                { 
                    timestamp: new Date().toISOString(), 
                    newFiles: updatedNewFiles 
                }, 
                null, 
                2
            )
        );

        const remainingCount = Object.keys(updatedNewFiles).length;
        console.log('\nAll done for now bruv! 🔥');
        if (remainingCount > 0) {
            console.log(`${remainingCount} files left to handle next time.`);
        } else {
            console.log('No files left to handle.');
        }
    } catch (err) {
        console.error('Error reading new files list:', err.message);
        return;
    }
}
