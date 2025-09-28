pragma circom 2.0.3;

include "circomlib/circuits/poseidon.circom";
include "circom-ecdsa/circuits/ecdsa.circom";
include "circom-ecdsa/circuits/zk-identity/eth.circom";
include "circom-ecdsa/circuits/vocdoni-keccak/keccak.circom";

// Simplified Merkle path verification using only Poseidon
template SimpleMerkleVerify(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels]; // 0 = left, 1 = right
    
    signal levelHashes[levels + 1];
    signal leftInputs[levels];
    signal rightInputs[levels];
    signal selector[levels];
    signal leftDiff[levels];
    signal rightDiff[levels];
    
    levelHashes[0] <== leaf;
    
    component hashers[levels];
    
    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        
        // Selector logic: 0 = (current, sibling), 1 = (sibling, current)
        selector[i] <== pathIndices[i];
        
        // Calculate differences for selection
        leftDiff[i] <== pathElements[i] - levelHashes[i];
        rightDiff[i] <== levelHashes[i] - pathElements[i];
        
        // Select inputs based on pathIndices
        leftInputs[i] <== levelHashes[i] + selector[i] * leftDiff[i];
        rightInputs[i] <== pathElements[i] + selector[i] * rightDiff[i];
        
        hashers[i].inputs[0] <== leftInputs[i];
        hashers[i].inputs[1] <== rightInputs[i];
        
        levelHashes[i + 1] <== hashers[i].out;
    }
    
    root === levelHashes[levels];
}





// Template to verify Ethereum address matches public key
template VerifyAddressPubkey(n, k) {
    signal input pubKey[2][k];      // ECDSA public key (2 coordinates x k chunks)
    signal input expectedAddr;      // Expected Ethereum address
    
    // Flatten public key to bits
    component flattenPubkey = FlattenPubkey(n, k);
    for (var i = 0; i < k; i++) {
        flattenPubkey.chunkedPubkey[0][i] <== pubKey[0][i];
        flattenPubkey.chunkedPubkey[1][i] <== pubKey[1][i];
    }
    
    // Convert flattened pubkey to Ethereum address
    component pubkeyToAddr = PubkeyToAddress();
    for (var i = 0; i < 512; i++) {
        pubkeyToAddr.pubkeyBits[i] <== flattenPubkey.pubkeyBits[i];
    }
    
    // Verify address matches
    pubkeyToAddr.address === expectedAddr;
}

// Domain suffix verification using hash decomposition
template VerifyDomainSuffix() {
    signal input baseName;            // Base name as field element (e.g., encoded "alice")  
    signal input domainSuffix;        // Domain suffix as field element (e.g., encoded "base.eth")
    signal input expectedSuffixHash;  // Required suffix hash (public input)
    signal input nameHash;            // Hash of full name for verification
    
    // Verify the provided suffix matches the expected suffix hash
    component suffixHasher = Poseidon(1);
    suffixHasher.inputs[0] <== domainSuffix;
    suffixHasher.out === expectedSuffixHash;
    
    // Reconstruct and verify full name hash
    // Full name = baseName + domainSuffix (conceptually "alice" + "base.eth")
    component fullNameHasher = Poseidon(2);
    fullNameHasher.inputs[0] <== baseName;
    fullNameHasher.inputs[1] <== domainSuffix;
    
    // Verify reconstructed name hash matches the provided nameHash
    fullNameHasher.out === nameHash;
}

// Main ENS SIWE verification circuit
template ENSSIWECircuit() {
    // ================================
    // PUBLIC INPUTS
    // ================================
    signal input merkleRoot;        // Merkle root of ENS tree
    signal input domainSuffixHash;  // Hash of domain suffix (e.g., keccak("base.eth"))
    
    // ================================
    // PRIVATE INPUTS
    // ================================
    
    // ENS entry data
    signal input nameHash;          // Hash of full domain name (e.g., keccak("alice.base.eth"))
    signal input ownerAddr;         // Owner's Ethereum address
    
    // Domain suffix verification inputs  
    signal input baseName;          // Base name as field element (e.g., encoded "alice")
    signal input domainSuffix;      // Domain suffix as field element (e.g., encoded "base.eth")
    
    // Merkle proof (reduced to 16 levels for efficiency)
    signal input leaf;              // Leaf hash = poseidon(nameHash, ownerAddr)
    signal input pathElements[16];  // Merkle path sibling hashes
    signal input pathIndex[16];     // Path indices (0 = left, 1 = right)
    
    // SIWE signature data (using standard n=64, k=4 for secp256k1)
    signal input msgHash[4];        // Hash of SIWE message (4x64 bit chunks)
    signal input r[4];              // ECDSA signature r component (4x64 bit chunks)
    signal input s[4];              // ECDSA signature s component (4x64 bit chunks)
    signal input pubKey[2][4];      // ECDSA public key (2 coordinates x 4x64 bit chunks)
    
    // ================================
    // CONSTRAINT 1: Merkle tree membership
    // ================================
    
    // Verify that the leaf exists in the Merkle tree
    component merkleVerifier = SimpleMerkleVerify(16);
    merkleVerifier.leaf <== leaf;
    merkleVerifier.root <== merkleRoot;
    
    for (var i = 0; i < 16; i++) {
        merkleVerifier.pathElements[i] <== pathElements[i];
        merkleVerifier.pathIndices[i] <== pathIndex[i];
    }
    
    // ================================
    // CONSTRAINT 2: Leaf consistency
    // ================================
    
    // Verify that leaf = poseidon(nameHash, ownerAddr)
    component leafVerifier = Poseidon(2);
    leafVerifier.inputs[0] <== nameHash;
    leafVerifier.inputs[1] <== ownerAddr;
    
    // Constraint: computed leaf must match provided leaf
    leafVerifier.out === leaf;
    
    // ================================
    // CONSTRAINT 3: Public key ownership verification
    // ================================
    
    // Verify that the public key corresponds to the owner address
    component addrVerifier = VerifyAddressPubkey(64, 4);
    for (var i = 0; i < 4; i++) {
        addrVerifier.pubKey[0][i] <== pubKey[0][i];
        addrVerifier.pubKey[1][i] <== pubKey[1][i];
    }
    addrVerifier.expectedAddr <== ownerAddr;
    
    // ================================
    // CONSTRAINT 4: SIWE signature verification
    // ================================
    
    // Verify ECDSA signature using the circom-ecdsa library
    component ecdsaVerifier = ECDSAVerifyNoPubkeyCheck(64, 4);
    
    // Connect signature components
    for (var i = 0; i < 4; i++) {
        ecdsaVerifier.r[i] <== r[i];
        ecdsaVerifier.s[i] <== s[i];
        ecdsaVerifier.msghash[i] <== msgHash[i];
        ecdsaVerifier.pubkey[0][i] <== pubKey[0][i];
        ecdsaVerifier.pubkey[1][i] <== pubKey[1][i];
    }
    
    // Signature must be valid
    ecdsaVerifier.result === 1;
    
    // ================================
    // CONSTRAINT 5: Domain suffix verification
    // ================================
    
    // Verify that the full ENS name contains the required domain suffix
    component domainVerifier = VerifyDomainSuffix();
    domainVerifier.baseName <== baseName;
    domainVerifier.domainSuffix <== domainSuffix;
    domainVerifier.expectedSuffixHash <== domainSuffixHash;
    domainVerifier.nameHash <== nameHash;
}

component main = ENSSIWECircuit();