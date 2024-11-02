const getUserHome = () => process.env[
  (process.platform == 'win32') ? 'USERPROFILE' : 'HOME'
];

const n8nFolder = `${getUserHome()}/.n8n`;
const customNodePath = `${n8nFolder}/nodes`;

// insert code for locating, copying, and installing custom nodes here
// run as postinstall script
// add n8n config file to specify custom extensions