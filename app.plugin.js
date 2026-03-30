const { withAppBuildGradle, withProjectBuildGradle, withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Network Security Config XML for HTTPS API
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

function withNetworkSecurityConfig(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { getMainApplication } = AndroidConfig.Manifest;
    
    // Get main application element
    const mainApplication = getMainApplication(androidManifest);
    
    if (!mainApplication) {
      return config;
    }
    
    // Add network security config attribute
    if (!mainApplication.$['android:networkSecurityConfig']) {
      mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    
    // Ensure usesCleartextTraffic is set to false for HTTPS
    if (!mainApplication.$['android:usesCleartextTraffic']) {
      mainApplication.$['android:usesCleartextTraffic'] = 'false';
    }
    
    return config;
  });
}

// Network security config file is now managed by Expo via app.json
// No need to manually create files - Expo handles it automatically
function withNetworkSecurityConfigFile(config) {
  // This function is kept for backward compatibility but does nothing
  // Expo automatically copies networkSecurityConfig from app.json
  return config;
}

function withFixDuplicateClasses(config) {
  // Modify project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Add configuration to exclude old support libraries at project level
    const excludeConfig = `
allprojects {
    configurations.all {
        exclude group: 'com.android.support', module: 'support-compat'
        exclude group: 'com.android.support', module: 'versionedparcelable'
        exclude group: 'com.android.support', module: 'localbroadcastmanager'
    }
}
`;
    
    // Insert before the buildscript or allprojects block
    if (buildGradle.includes('allprojects {')) {
      config.modResults.contents = buildGradle.replace(
        /(allprojects\s*\{)/,
        `$1\n    configurations.all {\n        exclude group: 'com.android.support', module: 'support-compat'\n        exclude group: 'com.android.support', module: 'versionedparcelable'\n        exclude group: 'com.android.support', module: 'localbroadcastmanager'\n    }`
      );
    } else if (buildGradle.includes('buildscript {')) {
      config.modResults.contents = buildGradle.replace(
        /(buildscript\s*\{)/,
        `${excludeConfig}\n$1`
      );
    }
    
    return config;
  });
  
  // Modify app-level build.gradle
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Add to android block
    if (buildGradle.includes('android {')) {
      const androidBlock = buildGradle.match(/android\s*\{[^}]*\}/s);
      if (androidBlock && !androidBlock[0].includes('configurations.all')) {
        config.modResults.contents = buildGradle.replace(
          /(android\s*\{)/,
          `$1\n    configurations.all {\n        exclude group: 'com.android.support', module: 'support-compat'\n        exclude group: 'com.android.support', module: 'versionedparcelable'\n        exclude group: 'com.android.support', module: 'localbroadcastmanager'\n    }`
        );
      }
    }
    
    return config;
  });
}

// Plugin to create network security config files
function withNetworkSecurityConfigFile(config) {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      {
        // This plugin runs during prebuild
        name: 'network-security-config',
        _internal: {
          // Create files after Android project is created
          onCreateAndroidProject: async (ctx) => {
            const androidPath = path.join(ctx.projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
            const debugPath = path.join(ctx.projectRoot, 'android', 'app', 'src', 'debug', 'res', 'xml');
            
            // Ensure directories exist
            if (!fs.existsSync(androidPath)) {
              fs.mkdirSync(androidPath, { recursive: true });
            }
            if (!fs.existsSync(debugPath)) {
              fs.mkdirSync(debugPath, { recursive: true });
            }
            
            // Write network security config files
            fs.writeFileSync(
              path.join(androidPath, 'network_security_config.xml'),
              NETWORK_SECURITY_CONFIG
            );
            fs.writeFileSync(
              path.join(debugPath, 'network_security_config.xml'),
              NETWORK_SECURITY_CONFIG
            );
            
            console.log('✅ Network security config files created');
          },
        },
      },
    ],
  };
}

// Main plugin function
function withHttpsSSLFix(config) {
  // DO NOT modify networkSecurityConfig here - Expo handles it via app.json
  // The networkSecurityConfig field in app.json automatically:
  // 1. Copies the file from assets/ to android/app/src/main/res/xml/
  // 2. Adds the manifest reference
  
  // Apply duplicate classes fix only
  config = withFixDuplicateClasses(config);
  
  return config;
}

module.exports = withHttpsSSLFix;
