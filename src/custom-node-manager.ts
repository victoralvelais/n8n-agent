import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import config from '../n8n.config.ts';

const getUserHome = () => process.env[
  (process.platform == 'win32') ? 'USERPROFILE' : 'HOME'
];

const n8nFolder = path.join(getUserHome() || '', '.n8n');
const customNodePath = path.join(n8nFolder, 'nodes');

async function setupCustomNodes() {
  // Ensure directories exist
  await fs.mkdir(customNodePath, { recursive: true });

  const communityNodes = config.nodes.communityNodes;

  for (const nodeName of communityNodes) {
    try {
      // Get node package from npm
      await installNodePackage(nodeName, customNodePath);
      console.log(`Successfully installed ${nodeName} to custom node path`);
    } catch (error) {
      console.error(`Failed to install ${nodeName}:`, error);
    }
  }
}

// Export the setup function
export const initializeCustomNodes = async () => {
  try {
    await setupCustomNodes();
    console.log('Custom nodes setup completed');
  } catch (error) {
    console.error('Failed to setup custom nodes:', error);
    throw error;
  }
};

const installNodePackage = async (nodeSource: string, nodeDestination: string) => {
  // Handle GitHub repository format
  console.log(`Installing ${nodeSource} to ${nodeDestination}`);
  const command = `npm i ${nodeSource} --prefix "${nodeDestination}"`;
  execSync(command);
  
  if (nodeSource.includes('github.com')) {
    // Get the package name from the last part of the repo URL
    const repoPattern = /github\.com\/(\w+)\/([a-z0-9]+(?:-[a-z0-9]+)*$)/
    const repo = nodeSource.match(repoPattern);
    const repoFolder = `@${repo?.[1]}/${repo?.[2]}`;
    
    // Change to the package directory
    const packagePath = path.join(nodeDestination, 'node_modules', repoFolder);
    process.chdir(packagePath);
    
    runCommand('npm install', nodeSource);
    // execSync('npm install');
    runCommand('npm run build', nodeSource);
    // execSync('npm run build');
  }

  return true;
};

const runCommand = async (cmd: string, nodeName: string) => {
  try {
    const output = execSync(cmd, { 
      stdio: 'pipe',
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // Increase buffer size for large outputs
    });
    console.log(`\n=== Installation output for ${nodeName} ===`);
    console.log(output);
    console.log(`=== End of installation for ${nodeName} ===\n`);
    return true;
  } catch (error) {
    console.log(`\n=== Error output for ${nodeName} ===`);
    console.log(error.stdout?.toString());
    console.log(error.stderr?.toString());
    throw error;
  }
};

initializeCustomNodes();