# Nymph - JWT Circuit with Mopro Bindings

This project contains a JWT verification circuit implemented in Noir with Mopro bindings for cross-platform deployment.

## Repository Structure

```
nymph/
├── app/                          # Expo React Native app (run this)
├── starter-shit/                   # Mopro bindings + Noir circuit
│   ├── noir-circuit/             # Noir JWT circuit
│   │   ├── src/main.nr           # JWT verification circuit
│   │   ├── nargo.toml            # Noir project configuration
│   │   └── target/               # Compiled circuit artifacts
│   ├── src/                      # Rust source code for Mopro
│   ├── test-vectors/noir/        # Circuit JSON artifacts
│   ├── Config.toml
│   └── Cargo.toml
└── README.md                     # This file
```

## Workflow

1. Circuit development in `starter-shit/noir-circuit/`
2. Build Mopro bindings in `starter-shit/` as needed
3. Run the mobile app from `app/`

## Run the Expo app (from scratch)

- Prereqs:
  - Node 18+ and npm 9+ (or yarn/pnpm)
  - Xcode for iOS; Android Studio + SDK/NDK for Android
  - Expo CLI: `npm i -g expo`

- Install dependencies:
  - `cd app`
  - `npm install`

- Start the app:
  - Web: `npm run web`
  - iOS: `npm run ios`
  - Android: `npm run android`
  - Dev server only: `npm start`

- OAuth configuration (optional; dev mode uses mock creds):
  - Set environment variables if using real OAuth:
    - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
    - `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`
  - Values are read via `process.env` in `app/src/config/oauth.ts` and `app/src/config/index.ts`.

## Quick Start

### 1. Compile the Noir Circuit
```bash
cd starter-shit/noir-circuit
nargo compile
```

### 2. Copy Circuit Artifact
```bash
cd ../starter-shit
cp noir-circuit/target/stealthnote_jwt.json test-vectors/noir/
```

### 3. Build Mopro Bindings
```bash
cargo build
```

### 4. Generate Platform-Specific Libraries
```bash
# iOS (requires Xcode)
cargo run --bin ios

# Android (requires Android NDK)
cargo run --bin android

# Web (requires wasm-pack)
cargo run --bin web
```

### 5. Using bindings
The app currently uses mock bindings in `app/src/lib/circuits/jwt.ts`. Swap to real bindings when available.

## Circuit Details

The JWT verification circuit validates:
- RSA/SHA256 JWT signatures
- Domain ownership in email claims
- Ephemeral key nonces
- Email verification status

## Requirements

- Rust toolchain
- Noir compiler (nargo)
- Platform-specific tools (Xcode for iOS, Android NDK for Android)
- wasm-pack for web builds