const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAndroidMopro(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      // Copy native libraries to jniLibs
      const sourceLibsPath = path.join(projectRoot, 'src', 'bindings', 'android', 'jniLibs');
      const targetLibsPath = path.join(platformProjectRoot, 'app', 'src', 'main', 'jniLibs');

      if (fs.existsSync(sourceLibsPath)) {
        // Ensure target directory exists
        if (!fs.existsSync(targetLibsPath)) {
          fs.mkdirSync(targetLibsPath, { recursive: true });
        }

        // Copy libraries for each architecture
        const architectures = ['arm64-v8a', 'x86_64'];
        
        architectures.forEach(arch => {
          const sourceArchPath = path.join(sourceLibsPath, arch);
          const targetArchPath = path.join(targetLibsPath, arch);
          
          if (fs.existsSync(sourceArchPath)) {
            if (!fs.existsSync(targetArchPath)) {
              fs.mkdirSync(targetArchPath, { recursive: true });
            }
            
            // Copy all .so files
            const files = fs.readdirSync(sourceArchPath);
            files.forEach(file => {
              if (file.endsWith('.so')) {
                const sourcePath = path.join(sourceArchPath, file);
                const targetPath = path.join(targetArchPath, file);
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`Copied ${file} for ${arch}`);
              }
            });
          }
        });
      }

      // Copy Kotlin bindings
      const sourceKotlinPath = path.join(projectRoot, 'src', 'bindings', 'android', 'uniffi', 'mopro');
      const targetKotlinPath = path.join(platformProjectRoot, 'app', 'src', 'main', 'java', 'uniffi', 'mopro');

      if (fs.existsSync(sourceKotlinPath)) {
        if (!fs.existsSync(targetKotlinPath)) {
          fs.mkdirSync(targetKotlinPath, { recursive: true });
        }

        const files = fs.readdirSync(sourceKotlinPath);
        files.forEach(file => {
          if (file.endsWith('.kt')) {
            const sourcePath = path.join(sourceKotlinPath, file);
            const targetPath = path.join(targetKotlinPath, file);
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`Copied ${file} to Kotlin sources`);
          }
        });
      }

      return config;
    },
  ]);
}

module.exports = withAndroidMopro;
