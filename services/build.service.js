const { exec } = require('child_process');

// Function to execute shell command
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(error);
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      resolve();
    });
  });
}

// Sequential execution of build commands
async function runBuild() {
  try {
    await executeCommand('node ./services/versionScript.js increment');
    await executeCommand('npm run clean');
    await executeCommand('npm run bundle');
    await executeCommand('npm run package-solution');
    await executeCommand('npm run deploy');
    console.log('Build successful');
  } catch (error) {
    console.log('Build failed, reverting version number');
    await executeCommand('node ./services/versionScript.js decrement');
  }
}

// Run the build process
runBuild();
