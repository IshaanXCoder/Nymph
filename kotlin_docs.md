<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# teach alll this concept to cursor in sperfucking detail

Kotlin SDK
In this section, you'll learn how to build a Kotlin SDK using Mopro's native bindings. The process includes the following steps:
[Generate the binding using the Mopro CLI](https://zkmopro.org/docs/sdk/kotlin#generate-the-bindings-using-the-mopro-cli)
[Integrate the binding into a Kotlin Package](https://zkmopro.org/docs/sdk/kotlin#integrate-the-bindings-into-a-kotlin-package)
[How to install the Kotlin SDK via JitPack](https://zkmopro.org/docs/sdk/kotlin#how-to-install-the-kotlin-sdk-via-jitpack)
[How to use the package](https://zkmopro.org/docs/sdk/kotlin#how-to-use-the-package)
Generate the bindings using the Mopro CLI
To get started with building Mopro bindings, refer to the [Getting Started](https://zkmopro.org/docs/getting-started) section. If you’d like to generate custom bindings for your own circuits or proving schemes, see the guide: [Rust Setup for Android/iOS Bindings](https://zkmopro.org/docs/setup/rust-setup).
Then you will have a MoproAndroidBindings in the project directory.
Integrate the bindings into a Kotlin Package
Clone the SDK template repository:
git clone [https://github.com/zkmopro/mopro-kotlin-package](https://github.com/zkmopro/mopro-kotlin-package)

Replace the generated bindings:
Replace the bindings directory MoproAndroidBindings/uniffi and MoproAndroidBindings/jniLibs with your generated files in the following location:
android/app/src/main/java/uniffi
android/app/src/main/jniLibs
Alternatively, you can run the following commands to copy your generated bindings into the correct location:
cp -r PATH/TO/MoproAndroidBindings/uniffi android/app/src/main/java
cp -r PATH/TO/MoproAndroidBindings/jniLibs android/app/src/main

How to install the Kotlin SDK via JitPack
To get this library from GitHub using [JitPack](https://jitpack.io/):
Step 1. Add the JitPack repository to your settings.gradle.kts at the end of repositories:
dependencyResolutionManagement {
repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
repositories {
mavenCentral()
maven { url = uri("https://jitpack.io") }
}
}

Step 2. Add the dependency to your build.gradle.kts:
dependencies {
implementation("com.github.zkmopro:mopro-kotlin-package:Tag") // Or change to your own URL
}

Replace Tag with the desired release version, e.g. v0.1.0. See the [JitPack page](https://jitpack.io/#zkmopro/mopro-kotlin-package) for available versions.
Note: If you're using an Android template from mopro create, comment out these UniFFI dependencies in your build file to prevent duplicate class errors.
// // Uniffi
// implementation("net.java.dev.jna:jna:5.13.0@aar")
// implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.4")

How to use the package
Here is an example of how to integrate and use this example package
import uniffi.mopro.generateCircomProof
import uniffi.mopro.verifyCircomProof
import uniffi.mopro.ProofLib

val inputStr = "{\"b\":[\"5\"],\"a\":[\"3\"]}"
val zkeyPath = "/path/to/multiplier2_final.zkey"
val proof = generateCircomProof(zkeyPath, inputStr, ProofLib.ARKWORKS)
val isValid = verifyCircomProof(zkeyPath, proof, ProofLib.ARKWORKS)

Or checkout the [test-e2e](https://github.com/zkmopro/mopro/blob/793626f32ed34dcde382f5f304c301563126bc9d/test-e2e/android/app/src/main/java/com/mopro/mopro_app/MultiplierComponent.kt#L53) app.

Here is a detailed, step-by-step guide for building a Kotlin SDK using Mopro’s native bindings, including everything required from binding generation, Kotlin integration, JitPack install, and usage, as if instructing a developer with advanced technical background on every step and edge case.

***

### Generating Mopro Bindings with the CLI

- **Install and Configure the Mopro CLI:**
    - First, review the Mopro docs “Getting Started” section for basic rust+node tools install and basic environment set-up (correct toolchains, permissions, and CLI version—prefer exact matching releases).
    - The CLI can generate Android/iOS bindings for either your own custom zero-knowledge circuits or for those included with Mopro. To generate custom bindings, prep your Circom/Rust circuits first, then follow the [Rust Setup for Android/iOS Bindings] guide which configures cross-compilation, target selection, linker paths, and cargo commands specific to JNI/uniffi export.
    - After a successful run, you get a `MoproAndroidBindings` directory in your project root. Inside, there will be subfolders like `/uniffi` (Kotlin interface files) and `/jniLibs` (native shared libraries [.so], one for each supported ABI).

***

### Integrating Bindings Into A Kotlin Package

- **Clone Template Repository:**
    - Download the base SDK repo:
`git clone https://github.com/zkmopro/mopro-kotlin-package`
This repo scaffolds a minimal Android app pre-configured with Kotlin, JNI interoperability, and UniFFI glue code.
- **Copy/Replace Generated Bindings:**
    - Replace the auto-generated contents with your new bindings (copy or move):
        - Swap out `android/app/src/main/java/uniffi` with your generated `MoproAndroidBindings/uniffi`
        - Swap out `android/app/src/main/jniLibs` with your own `MoproAndroidBindings/jniLibs`
        - Fastest:

```shell
cp -r PATH/TO/MoproAndroidBindings/uniffi android/app/src/main/java
cp -r PATH/TO/MoproAndroidBindings/jniLibs android/app/src/main
```

    - This guarantees the runtime will find your latest ZK circuit logic and native libraries at build and run time.
- **Template Customization \& JNI Caveats:**
    - If you’re using an Android template produced by running `mopro create`, double-check your build.gradle for UniFFI dependencies; if both template and bindings use separate UniFFI versions, you’ll get duplicate class errors. Always comment out extra UniFFI dependencies like:

```
// // Uniffi
// implementation("net.java.dev.jna:jna:5.13.0@aar")
// implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.4")
```

This avoids class loader collisions and spurious runtime errors.

***

### Installing the Kotlin SDK Via JitPack

- **Add JitPack Repository:**
    - In `settings.gradle.kts` add at the end:

```kotlin
dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
  }
}
```

    - This enables pulling artifacts from JitPack so any GitHub release/tag is a simple dependency.
- **Add SDK Dependency:**
    - In your target module’s `build.gradle.kts`:

```kotlin
dependencies {
  implementation("com.github.zkmopro:mopro-kotlin-package:Tag") // Or change to your own URL
}
```

Replace `Tag` with your preferred release version: e.g.: `v0.1.0`, or a commit hash for bleeding-edge development branches.
Find all available versions on JitPack’s page for the repo.

***

### Using the SDK/Example Integration

- **Import and Use Mopro Functions:**
    - Example code for using the SDK to generate and verify zero-knowledge proofs:

```kotlin
import uniffi.mopro.generateCircomProof
import uniffi.mopro.verifyCircomProof
import uniffi.mopro.ProofLib

val inputStr = "{\"b\":[\"5\"],\"a\":[\"3\"]}" // Serialized circuit input
val zkeyPath = "/path/to/multiplier2_final.zkey" // Absolute or project-relative
val proof = generateCircomProof(zkeyPath, inputStr, ProofLib.ARKWORKS)
val isValid = verifyCircomProof(zkeyPath, proof, ProofLib.ARKWORKS)
```

    - This workflow calls into the UniFFI interface, passing parameters to your circuit, then receiving a real ZK proof, which is then checked for validity.
    - Always match your proof library between generation and verification (`ProofLib.ARKWORKS` to `ProofLib.ARKWORKS`, etc.).
- **Reference Apps and End-to-End Testing:**
    - See `test-e2e` in the Mopro repo for a complete Android example component. It demonstrates binding calls, result handling, UI feedback, and debugging signal flow for generated proofs.

***

### Key Observations, Pitfalls, and Optimization Steps

- Use **absolute paths** for your .zkey and .wasm circuit assets during proof gen/verify calls. Android asset packaging may mangle relative paths or cache.
- If working with custom circuits, verify your Rust/Circom compilation targets match the minimum supported JNI ABI (typically arm64-v8a/x86_64 for current Android devices).
- If you get linking/runtime JNI errors, double-check the presence and architecture of `.so` files in `jniLibs`.
- Commenting out duplicate dependencies prevents “duplicate class” Gradle build failures, especially with UniFFI and JNA libraries—review Gradle output closely for warnings.
- Always sync your Kotlin and Rust/UniFFI versions to avoid interface mismatches.

***

### Reference Table: Steps and Commands

| Step | Command/Path Example | Details/Notes |
| :-- | :-- | :-- |
| Generate Bindings | `mopro cli generate ...` | Get `MoproAndroidBindings`. |
| Clone Template | `git clone https://github.com/zkmopro/mopro-kotlin-package` | Fresh Android+Kotlin scaffold. |
| Replace Bindings | `cp -r .../uniffi` and `cp -r .../jniLibs` | Copy to `/src/main/java` and `/src/main/jniLibs`. |
| Add JitPack Repo | Add block to `settings.gradle.kts` | Enables GitHub/deployed artifact fetch. |
| Add SDK Dependency | Add to `build.gradle.kts` | Choose exact library version/tag. |
| Use SDK Functions | `import uniffi.mopro.*` | Call proof generation and verification methods. |


***

This covers every granular step and all automation/edge cases needed for integrating and deploying Kotlin SDKs with Mopro zero-knowledge bindings on Android, including project layout, dependencies, workaround for template conflicts, and live code usage. For anything not covered in doc links, consult `mopro-kotlin-package` issues for rare platform-specific bugs and OS compatibility changes.

