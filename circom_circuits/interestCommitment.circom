pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

// =============================================================================
// INTEREST COMMITMENT CIRCUIT
// Generates a cryptographic commitment to user's interest vector
// =============================================================================

template InterestCommitment(n) {
    // Private inputs (user's secret data)
    signal input interests[n];      // User's interest vector [0-100]
    signal input salt;              // Random salt for commitment security
    
    // Public outputs
    signal output commitment;               // Commitment hash
    signal output interestSum;             // Sum of all interests (for validation)
    
    // Validate each interest value is in valid range [0, 100]
    component rangeChecks[n];
    signal interest_partial_sums[n];
    
    for (var i = 0; i < n; i++) {
        // Check interest value is within bounds
        rangeChecks[i] = LessEqThan(7); // 2^7 = 128, so 0-100 is valid
        rangeChecks[i].in[0] <== interests[i];
        rangeChecks[i].in[1] <== 100;
        rangeChecks[i].out === 1;
    }
    
    // Accumulate total interests
    interest_partial_sums[0] <== interests[0];
    for (var i = 1; i < n; i++) {
        interest_partial_sums[i] <== interest_partial_sums[i-1] + interests[i];
    }
    
    interestSum <== interest_partial_sums[n-1];
    
    // Generate commitment using Poseidon hash
    // commitment = H(interest_1, interest_2, ..., interest_n, salt)
    component hasher = Poseidon(n + 1);
    for (var i = 0; i < n; i++) {
        hasher.inputs[i] <== interests[i];
    }
    hasher.inputs[n] <== salt;
    
    commitment <== hasher.out;
}

// =============================================================================
// MAIN CIRCUIT FOR COMPILATION
// =============================================================================

component main = InterestCommitment(15);