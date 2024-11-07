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
      const install = (nodeName.includes('github.com') ? installNodeGithub : installNodeNPM)
      await install(nodeName, customNodePath);
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

const installNodeNPM = async (nodeSource: string, nodeDestination: string) => {
  // Handle GitHub repository format
  const command = `npm i ${nodeSource} --prefix "${nodeDestination}"`;
  execSync(command);
  return true;
};

const installNodeGithub = async (nodeSource: string, nodeDestination: string) => {
  await installNodeNPM(nodeSource, nodeDestination);
  const repoPattern = /github\.com\/(\w+)\/([a-z0-9]+(?:-[a-z0-9]+)*$)/
  const repo = nodeSource.match(repoPattern);
  const repoFolder = `@${repo?.[1]}/${repo?.[2]}`;

  // Change to the package directory
  const packagePath = path.join(nodeDestination, 'node_modules', repoFolder);
  process.chdir(packagePath);

  await handleGitClone(nodeSource, packagePath);
  await runCommand('npm install', nodeSource);
  await runCommand('npm run build', nodeSource);
};

const handleGitClone = async (nodeSource: string, packagePath: string) => {
  console.log(`CLONING ${nodeSource} to ${packagePath}`);
  // Clear directory using fs
  const files = await fs.readdir(packagePath);
  for (const file of files) {
      const filePath = path.join(packagePath, file);
      await fs.rm(filePath, { recursive: true, force: true });
  }

  return runCommand(`git clone ${nodeSource} .`, nodeSource);
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