/**
 * Script to create network security config files for Android
 * This ensures the files are created even if the plugin hook doesn't run
 */

const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Base configuration for HTTPS API -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    
    <!-- Domain-specific configuration for API -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">passkidukaanapi.margerp.com</domain>
        <domain includeSubdomains="true">margerp.com</domain>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </domain-config>
    
    <!-- Allow cleartext for Metro bundler (development only) -->
    <domain-config cleartextTrafficPermitted="true">
        <domain>localhost</domain>
        <domain>127.0.0.1</domain>
        <domain>10.0.2.2</domain>
        <!-- Allow all private IP ranges for Metro bundler -->
        <domain includeSubdomains="true">192.168.0.0</domain>
        <domain includeSubdomains="true">10.0.0.0</domain>
        <domain includeSubdomains="true">172.16.0.0</domain>
        <domain includeSubdomains="true">172.17.0.0</domain>
        <domain includeSubdomains="true">172.18.0.0</domain>
        <domain includeSubdomains="true">172.19.0.0</domain>
        <domain includeSubdomains="true">172.20.0.0</domain>
        <domain includeSubdomains="true">172.21.0.0</domain>
        <domain includeSubdomains="true">172.22.0.0</domain>
        <domain includeSubdomains="true">172.23.0.0</domain>
        <domain includeSubdomains="true">172.24.0.0</domain>
        <domain includeSubdomains="true">172.25.0.0</domain>
        <domain includeSubdomains="true">172.26.0.0</domain>
        <domain includeSubdomains="true">172.27.0.0</domain>
        <domain includeSubdomains="true">172.28.0.0</domain>
        <domain includeSubdomains="true">172.29.0.0</domain>
        <domain includeSubdomains="true">172.30.0.0</domain>
        <domain includeSubdomains="true">172.31.0.0</domain>
        <!-- Expo tunnel domains -->
        <domain includeSubdomains="true">exp.host</domain>
        <domain includeSubdomains="true">exp.direct</domain>
        <domain includeSubdomains="true">expo.io</domain>
    </domain-config>
    
    <!-- Debug overrides - More permissive for development -->
    <debug-overrides>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>`;

function createNetworkSecurityConfig() {
  const projectRoot = process.cwd();
  const mainPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
  const debugPath = path.join(projectRoot, 'android', 'app', 'src', 'debug', 'res', 'xml');

  // Create directories if they don't exist
  if (!fs.existsSync(mainPath)) {
    fs.mkdirSync(mainPath, { recursive: true });
    console.log('✅ Created directory:', mainPath);
  }

  if (!fs.existsSync(debugPath)) {
    fs.mkdirSync(debugPath, { recursive: true });
    console.log('✅ Created directory:', debugPath);
  }

  // Write network security config files
  const mainFile = path.join(mainPath, 'network_security_config.xml');
  const debugFile = path.join(debugPath, 'network_security_config.xml');

  fs.writeFileSync(mainFile, NETWORK_SECURITY_CONFIG);
  console.log('✅ Created network security config:', mainFile);

  fs.writeFileSync(debugFile, NETWORK_SECURITY_CONFIG);
  console.log('✅ Created network security config:', debugFile);

  console.log('');
  console.log('🎉 Network security config files created successfully!');
  console.log('   Next step: Run "npx expo prebuild --clean" or "npx expo run:android"');
}

// Run if called directly
if (require.main === module) {
  createNetworkSecurityConfig();
}

module.exports = { createNetworkSecurityConfig, NETWORK_SECURITY_CONFIG };

