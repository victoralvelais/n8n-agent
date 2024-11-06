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

const installNodePackage = async (nodeName: string, nodeDestination: string) => {
  const command = `npm i ${nodeName} --prefix "${nodeDestination}"`;
  execSync(command);
  return true;
};

initializeCustomNodes();