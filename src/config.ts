import fs from 'fs';
import path from 'path';
import os from 'os';

function getConfigPath() {
  switch (process.platform) {
    case 'darwin': // MacOS
      return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'win32': // Windows
      return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    default:
      throw new Error('Unsupported platform');
  }
}

export function updateConfig() {
  const isNpx = Boolean(
    process.argv[1].includes('/_npx/') ||
    process.env.npm_command === 'exec' ||
    process.env._?.includes('/_npx/')
  );
  if (!isNpx) {
    console.log('Not running via npx');
    return;
  }

  const scriptPath = process.argv[1];
  const configPath = getConfigPath();

  try {
    // Read existing config or create new one
    let config: { mcpServers?: {'shell-server'?: { command: string }}} = {};
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      // File doesn't exist or is invalid JSON
      console.log('Creating new config file');
    }

    // Ensure required structure exists
    config.mcpServers = config.mcpServers || {};
    
    // Update the configuration
    config.mcpServers['shell-server'] = {
      command: scriptPath
    };

    // Create directory if it doesn't exist
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write the updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Updated config at:', configPath);
    console.log('Added server with command:', scriptPath);

  } catch (err) {
    console.error('Error updating config:', err);
    process.exit(1);
  }
}