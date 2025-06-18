const fs = require('fs');

const filePath = './config/package-solution.json'; // Update with actual JSON file path

function incrementVersion(version) {
    const parts = version.split('.').map(part => parseInt(part, 10));

    for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i] < 9) {
            parts[i]++;
            break;
        } else {
            if (i === 0) {
                // If the first part is also 9, reset and add a new part at the beginning
                parts[i] = 0;
                parts.unshift(1);
                break;
            } else {
                parts[i] = 0;
            }
        }
    }

    return parts.join('.');
}

function decrementVersion(version) {

  // Special case: do nothing if version is 1.0.0.0
  if ( version === "1.0.0.0") return version

  // Special case: do nothing if version is 0.0.0.0
  if ( version === "0.0.0.0") return version

  const parts = version.split('.').map(part => parseInt(part, 10));

  for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] > 0) {
          parts[i]--;
          break;
      } else {
          parts[i] = 9; // Set the current part to 9 if it's 0
          if (i === 0) {
              // Prevent setting to 9 at the highest order part
              parts[i] = 0;
              break;
          }
      }
  }

  return parts.join('.');
}

function updateVersion(action) {
  try {
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log("Current version:", json.solution.version);

      if (action === 'increment') {
          json.solution.version = incrementVersion(json.solution.version);
      } else if (action === 'decrement') {
          json.solution.version = decrementVersion(json.solution.version);
      } else {
          throw new Error("Invalid action specified. Use 'increment' or 'decrement'.");
      }

      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
      console.log(`Version updated to ${json.solution.version}`);
  } catch (error) {
      console.error("Error updating version:", error);
  }
}

// Determine action based on a command-line argument
const action = process.argv[2]; // 'increment' or 'decrement'
updateVersion(action);