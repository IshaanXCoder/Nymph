# Nymph Kotlin Android App

A native Android application built with Kotlin and Jetpack Compose, featuring zero-knowledge proof generation using Mopro bindings.

## Features

- **Native Android UI** with Jetpack Compose
- **Zero-Knowledge Proofs** using Mopro/UniFFI bindings
- **Authentication** with Clerk (Google/Microsoft OAuth)
- **Circuit Testing** with comprehensive test suite
- **Modern Architecture** with MVVM pattern

## Prerequisites

- Android Studio Arctic Fox or later
- Android SDK API 24+ (Android 7.0)
- Java 11 or later
- Kotlin 1.9+

## Setup

### 1. Clone and Setup

The project structure is already set up with:
- Mopro Android bindings copied from `MoproAndroidBindings/`
- All necessary dependencies in `build.gradle.kts`
- Kotlin services for authentication and proof generation

### 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.template .env.local
   ```

2. Add your Clerk publishable key to `.env.local`:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```

   You can get this from your [Clerk Dashboard](https://dashboard.clerk.dev/).

### 3. Build and Run

1. Open the project in Android Studio:
   ```bash
   open -a "Android Studio" /Users/ishaan/Developer/nymph/kotlin-app
   ```

2. Let Android Studio sync the project and download dependencies.

3. Build and run:
   - Click the "Run" button in Android Studio
   - Or use the command line:
     ```bash
     ./gradlew assembleDebug
     ```

## Project Structure

```
kotlin-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/nymph/example/
│   │   │   ├── MainActivity.kt          # Main UI with Compose
│   │   │   ├── services/
│   │   │   │   ├── MoproService.kt      # ZK proof generation
│   │   │   │   └── ClerkAuthService.kt  # Authentication
│   │   │   ├── viewmodels/
│   │   │   │   └── MainViewModel.kt     # State management
│   │   │   └── ui/theme/               # Compose theme
│   │   ├── jniLibs/                    # Mopro native libraries
│   │   ├── uniffi/                     # Mopro Kotlin bindings
│   │   └── assets/                     # Circuit files (add your .zkey files here)
│   └── build.gradle.kts
├── gradle.properties
└── settings.gradle.kts
```

## Key Components

### MoproService
Handles zero-knowledge proof generation and verification:
- `testMoproBindings()` - Test basic Mopro functionality
- `generateCircomProof()` - Generate proofs from circuit inputs
- `verifyCircomProof()` - Verify generated proofs
- `runCircuitTests()` - Comprehensive test suite

### ClerkAuthService
Manages user authentication:
- `signInWithGoogle()` - Google OAuth flow
- `signInWithMicrosoft()` - Microsoft OAuth flow
- `extractDomainFromEmail()` - Domain extraction for proofs

### MainViewModel
Reactive state management using Kotlin StateFlow:
- Authentication state
- Proof generation results
- Loading states and error handling

## Usage

1. **Sign In**: Use Google or Microsoft OAuth to authenticate
2. **Run Tests**: Tap the play button to run circuit tests
3. **View Results**: See proof generation results in the UI
4. **Settings**: Access account and testing options

## Adding Circuit Files

1. Place your `.zkey` and `.wasm` files in `app/src/main/assets/`
2. Update `MoproService.kt` to reference your circuit files
3. Modify input generation in `generateCircomProof()` calls

## Dependencies

- **Jetpack Compose** - Modern Android UI
- **Clerk Android SDK** - Authentication
- **Mopro/UniFFI** - Zero-knowledge proof bindings
- **Kotlin Coroutines** - Async operations
- **Material 3** - Design system

## Troubleshooting

### Build Issues
- Ensure Java 11+ is configured in Android Studio
- Check that NDK version matches `gradle.properties` (25.1.8937393)
- Clean and rebuild: `./gradlew clean build`

### Runtime Issues
- Verify `.zkey` files are in `assets/` directory
- Check Clerk publishable key is valid
- Enable USB debugging for device testing

## Migration from React Native

This Kotlin app replaces the React Native version with:
- ✅ Native Android performance
- ✅ Direct Mopro binding integration
- ✅ Simplified authentication flow
- ✅ Better error handling and logging
- ✅ Modern Compose UI

## Next Steps

1. Add your actual Clerk publishable key
2. Test authentication flows
3. Add your circuit files to assets/
4. Customize UI and branding as needed
5. Deploy to Google Play Store

For more information about Mopro integration, see:
- [Mopro Android Setup](https://zkmopro.org/docs/setup/android-setup)
- [Mopro Kotlin SDK](https://zkmopro.org/docs/sdk/kotlin)
