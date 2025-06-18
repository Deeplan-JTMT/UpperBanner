const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Add the supportFullBleed to the manifest.
 */
function addSupportFullBleed(path) {

    fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        // Split the content by new line to insert the new property on a specific line
        let lines = data.split('\n');

        // Your specific line number where to add the new property
        const lineNumber = 12; // Arrays are zero-indexed, so line 13 is at index 12

        let flag = data.includes(`"supportsFullBleed": true,`)
        
        if (flag) {
            console.error("supportsFullBleed already exist.")
            return
        }
        // Check if the line number is within the bounds of the current file
        if (lineNumber >= 0 && lineNumber <= lines.length && !flag) {
            // Insert the new property at the specified line number
            lines[lineNumber] = `${lines[lineNumber]} \n  "supportsFullBleed": true,`

            // Convert the array of lines back into a single string
            let modifiedData = lines.join('\n');

            // Write the modified data back to the file
            fs.writeFile(path, modifiedData, 'utf8', (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('File updated successfully.');
                }
            });
        } else {
            console.log('Specified line number is out of bounds.');
        }
    });
}

/**
 * Get the manifest path and then calls addSupportFullBleed().
 */
function getManifestInDirectory(directoryPath) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${directoryPath}`, err);
            return;
        }

        // Filter and sort .manifest.json files
        const manifestFiles = files
            .filter(file => file.endsWith('.manifest.json'))
            .sort(); // Sorts alphabetically by default

        if (manifestFiles.length === 0) {
            console.error('No .manifest.json files found.');
            return;
        }

        // Select the last file based on alphabetical order
        const lastManifestFile = manifestFiles[manifestFiles.length - 1];
        const fullPath = path.join(directoryPath, lastManifestFile);
        console.log("fs.readdir - fullPath:", fullPath)

        // Call your function to update the selected manifest file
        addSupportFullBleed(fullPath);
    });
}

/**
 * Add the solution.version.
 */
function updateWebPartFile(filePath) {
    
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the file:', err);
      return;
    }

    // Flags to check if modifications are necessary
    let needsSolutionImport = !data.includes('const { solution } = require("../../../config/package-solution.json");');
    let needsVersionUpdate = !data.includes('return Version.parse(solution.version);');

    // Modify the content if necessary
    if (needsSolutionImport || needsVersionUpdate) {
      let updatedData = data;

      if (needsSolutionImport) {
        // Insert the require statement after the last import
        const lastImportIndex = updatedData.lastIndexOf('import');
        const insertionIndex = updatedData.indexOf('\n', lastImportIndex) + 1;
        updatedData = updatedData.slice(0, insertionIndex) + 'const { solution } = require("../../../config/package-solution.json");\n' + updatedData.slice(insertionIndex);
      }

      if (needsVersionUpdate) {
        updatedData = updatedData.replace(`return Version.parse('1.0');`, 'return Version.parse(solution.version);');
      }

      // Write the updated content back to the file
      fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing the updated file:', writeErr);
          return;
        }
        console.log('File has been updated successfully.');
      });
    } else {
      console.log('No updates are necessary.');
    }
  });
}

/**
 * Get the main web part path and then calls updateWebPartFile().
 */
function getMainWebPartFileInDirectory(directoryPath, filePattern) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${directoryPath}`, err);
            return;
        }

        // Filter files by the provided pattern and sort them
        const filteredFiles = files.filter(file => filePattern.test(file)).sort();

        if (filteredFiles.length === 0) {
            console.error(`No files matching the pattern ${filePattern} found.`);
            return;
        }

        // Select the last file based on the sorting
        const lastFile = filteredFiles[filteredFiles.length - 1];
        const fullPath = path.join(directoryPath, lastFile);

        // Apply updates to the selected file
        updateWebPartFile(fullPath);
    });
}

/**
 * Delete the eslintrc.js file.
 */
function deleteEslintrc() {
    // Convert to absolute path to avoid confusion
    const absolutePath = "./.eslintrc.js";

    fs.access(absolutePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist
            console.error(`File does not exist: ${absolutePath}`);
            return;
        }

        // File exists, proceed to delete
        fs.unlink(absolutePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${absolutePath}`);
                return;
            }
            console.log(`File deleted successfully: ${absolutePath}`);
        });
    });
}

/**
 * Copies a file or recursively copies a directory from source to destination.
 * @param {string} source - The path to the source file or directory.
 * @param {string} destination - The path to the destination directory.
 */

function copyFileOrDirectory(source, destination) {
    fs.stat(source, function(err, stats) {
        if (err) {
            console.error(`Error accessing source: ${source}`, err);
            return;
        }

        if (stats.isFile()) {
            const destDir = path.dirname(destination);
            const destFile = path.join(destination, path.basename(source)); // Ensure the file name is included in the destination path
            fs.mkdir(destDir, { recursive: true }, (err) => {
                if (err) {
                    console.error(`Error creating directory: ${destDir}`, err);
                    return;
                }

                fs.copyFile(source, destFile, (err) => { // Use destFile instead of destination
                    if (err) {
                        console.error(`Error copying file from ${source} to ${destFile}`, err); // Adjusted to use destFile
                        return;
                    }
                    console.log(`File copied from ${source} to ${destFile}`); // Adjusted to use destFile
                });
            });
        } else if (stats.isDirectory()) {
            fs.mkdir(destination, { recursive: true }, (err) => {
                if (err) {
                    console.error(`Error creating directory: ${destination}`, err);
                    return;
                }

                fs.readdir(source, (err, files) => {
                    if (err) {
                        console.error(`Error reading directory: ${source}`, err);
                        return;
                    }

                    files.forEach((file) => {
                        const newSourcePath = path.join(source, file);
                        const newDestinationPath = path.join(destination, file);
                        copyFileOrDirectory(newSourcePath, newDestinationPath);
                    });
                });
            });
        }
    });
}


/**
 * Replaces the "scripts" section in package.json with a new set of scripts.
 * @param {string} packageJsonPath - The path to the package.json file.
 */
function replacePackageJsonScripts(packageJsonPath) {
    fs.readFile(packageJsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading ${packageJsonPath}:`, err);
            return;
        }

        try {
            const packageJson = JSON.parse(data);

            // New scripts to be inserted
            const newScripts = {
                "build": "node ./services/updateVersion.service.js && npm run clean && npm run bundle && npm run package-solution && npm run open-explorer",
                "build-bash": "npm run compile && npm run runBuild",
                "compile": "chmod +x ./services/runBuild.bash",
                "runBuild": "bash ./services/runBuild.bash",
                "clean": "gulp clean",
                "bundle": "gulp bundle --ship --continueOnError",
                "package-solution": "gulp package-solution --ship",
                "open-explorer": "start sharepoint\\solution",
                "deploy": "powershell -File ./services/deployApp.service.ps1",
                "start": "gulp bundle --custom-serve --max_old_space_size=4096 && fast-serve",
                "serve": "fast-serve"
            };

            // Replace the scripts section
            packageJson.scripts = newScripts;

            // Write the modified package.json back to file
            fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error(`Error writing ${packageJsonPath}:`, err);
                    return;
                }
                console.log(`Scripts section in ${packageJsonPath} replaced successfully.`);
            });
        } catch (error) {
            console.error('Error parsing JSON from package.json:', error);
        }
    });
}

/**
 * Runs a list of commands sequentially, with support for interactive input.
 * @param {Array.<{command: string, args: string[]}>} commands - An array of objects containing the command and its arguments.
 * @param {number} [index=0] - The current index of the command to run.
 */
function runCommandsWithInput(commands, index = 0) {
    if (index >= commands.length) {
        console.log('All commands executed successfully.');
        return; // All commands have been executed
    }

    const { command, args, input } = commands[index];
    console.log(`Executing command: ${command} ${args.join(' ')}`);

    // Corrected stdio configuration for interaction and output capture
    const spawnedProcess = spawn(command, args, { stdio: ['pipe', 'inherit', 'inherit'], shell: true });

    if (input) {
        spawnedProcess.stdin.write(input);
        spawnedProcess.stdin.end(); // Ensure to close the stdin to continue execution
    }

    spawnedProcess.on('close', (code) => {
        console.log(`Command "${command}" exited with code ${code}.`);
        // Recursively call the next command in the sequence
        runCommandsWithInput(commands, index + 1);
    });

    spawnedProcess.on('error', (error) => {
        console.error(`Error with command "${command}": ${error}`);
    });
}

const directoryPath = './src/webparts/upperBanner'; // Adjust the path to your directory
const filePattern = /\.ts$/; // Regex pattern to match .ts files

const commandsToRun = [
    { command: 'npm', args: ['i', 'spfx-fast-serve', '-g'] },
    { command: 'spfx-fast-serve', args: [], input: '\n' }, // Simulate pressing Enter
    { command: 'npm', args: ['i'] }
];

// Example usage:
// getManifestInDirectory(directoryPath);
// getMainWebPartFileInDirectory(directoryPath, filePattern);
// deleteEslintrc()
// copyFileOrDirectory("../../AssetsFiles/PnPjsConfig.ts", "./src/webparts")
// copyFileOrDirectory("../../AssetsFiles/services", "./services")
// copyFileOrDirectory("../../AssetsFiles/fast-serve", "./fast-serve")
// const packageJsonPath = path.join(__dirname, 'package.json'); // Adjust the path as necessary
// replacePackageJsonScripts(packageJsonPath);
// runCommandsWithInput(commandsToRun);
