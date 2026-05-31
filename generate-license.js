const crypto = require('crypto');
const readline = require('readline');

// Standard terminal colors
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

console.clear();
console.log(`${BOLD}${CYAN}==========================================================${RESET}`);
console.log(`${BOLD}${GREEN}           RESTROOS ENTERPRISE LICENSE GENERATOR          ${RESET}`);
console.log(`${BOLD}${CYAN}==========================================================${RESET}`);
console.log();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateKey(hardwareId) {
  const cleanId = hardwareId.trim().toUpperCase();
  
  if (!cleanId || cleanId.length !== 8 || !/^[0-9A-F]{8}$/.test(cleanId)) {
    console.log();
    console.log(`${RED}[ERROR] Invalid Hardware ID format!${RESET}`);
    console.log(`${YELLOW}A valid Hardware ID must be exactly 8 hexadecimal characters (e.g. A7B9C3D2).${RESET}`);
    console.log();
    askHardwareId();
    return;
  }

  // Cryptographic Key Generation tied to Hardware ID
  const salt = '-rsk-secret-salt-2026';
  const rawHash = crypto.createHash('sha256').update(cleanId + salt).digest('hex');
  const signature = rawHash.substring(0, 16).toUpperCase();
  const activationKey = `RSK-${signature}`;

  console.log();
  console.log(`${BOLD}${GREEN}✔ ACTIVATION KEY GENERATED SUCCESSFULLY!${RESET}`);
  console.log();
  console.log(`${CYAN}----------------------------------------------------------${RESET}`);
  console.log(`  ${BOLD}Customer Hardware ID:${RESET}   ${YELLOW}${cleanId}${RESET}`);
  console.log(`  ${BOLD}Generated License Key:${RESET}  ${BOLD}${GREEN}${activationKey}${RESET}`);
  console.log(`${CYAN}----------------------------------------------------------${RESET}`);
  console.log();
  console.log(`${BOLD}Instructions:${RESET}`);
  console.log(`1. Provide this Activation Key directly to the customer.`);
  console.log(`2. They must enter it on the POS Onboarding screen to activate their terminal.`);
  console.log();
  rl.close();
}

function askHardwareId() {
  rl.question(`${BOLD}${CYAN}Enter Customer's Hardware ID (e.g., A7B9C3D2): ${RESET}`, (answer) => {
    generateKey(answer);
  });
}

// Support command-line argument direct execution (e.g. node generate-license.js A7B9C3D2)
const args = process.argv.slice(2);
if (args.length > 0) {
  generateKey(args[0]);
} else {
  askHardwareId();
}
