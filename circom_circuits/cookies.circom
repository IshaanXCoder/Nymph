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
// INTEREST MATCHING CIRCUIT
// Proves user's interests match ad campaign without revealing exact interests
// =============================================================================

template InterestMatcher(n) {
    // Private inputs (user's secret data)
    signal input user_interests[n]; // User's interest vector
    signal input salt;              // Salt used in commitment
    
    // Public inputs (ad campaign parameters)
    signal input ad_weights[n];             // Ad targeting weights
    signal input threshold;                 // Minimum score for match
    signal input commitment;                // User's previous commitment
    
    // Public outputs
    signal output is_match;                 // 1 if match, 0 otherwise
    signal output score_range;              // Coarse score range (privacy-preserving)
    
    // Internal signals
    signal score;                          // Actual computed score (private)
    
    // Step 1: Verify commitment matches user interests
    component commitmentVerifier = Poseidon(n + 1);
    for (var i = 0; i < n; i++) {
        commitmentVerifier.inputs[i] <== user_interests[i];
    }
    commitmentVerifier.inputs[n] <== salt;
    
    component commitmentCheck = IsEqual();
    commitmentCheck.in[0] <== commitmentVerifier.out;
    commitmentCheck.in[1] <== commitment;
    commitmentCheck.out === 1; // Commitment must match
    
    // Step 2: Validate user interests are in valid range
    component interestRangeChecks[n];
    for (var i = 0; i < n; i++) {
        interestRangeChecks[i] = LessEqThan(7);
        interestRangeChecks[i].in[0] <== user_interests[i];
        interestRangeChecks[i].in[1] <== 100;
        interestRangeChecks[i].out === 1;
    }
    
    // Step 3: Compute dot product score
    // score = Σ(user_interests[i] * ad_weights[i])
    signal products[n];
    signal partial_sums[n];
    
    for (var i = 0; i < n; i++) {
        products[i] <== user_interests[i] * ad_weights[i];
    }
    
    // Compute cumulative sum
    partial_sums[0] <== products[0];
    for (var i = 1; i < n; i++) {
        partial_sums[i] <== partial_sums[i-1] + products[i];
    }
    
    score <== partial_sums[n-1];
    
    // Step 4: Check if score exceeds threshold
    component thresholdCheck = GreaterEqThan(20); // Support scores up to 2^20
    thresholdCheck.in[0] <== score;
    thresholdCheck.in[1] <== threshold;
    
    is_match <== thresholdCheck.out;
    
    // Step 5: Compute privacy-preserving score range
    // Instead of revealing exact score, reveal which range it falls into
    component scoreRangeCalculator = ScoreRangeCalculator();
    scoreRangeCalculator.score <== score;
    scoreRangeCalculator.is_match <== is_match;
    
    score_range <== scoreRangeCalculator.range;
}

// =============================================================================
// SCORE RANGE CALCULATOR
// Maps exact scores to privacy-preserving ranges
// =============================================================================

template ScoreRangeCalculator() {
    signal input score;
    signal input is_match;
    signal output range;
    
    // Define score ranges for privacy preservation
    // Range 0: score < 1000
    // Range 1: 1000 <= score < 3000  
    // Range 2: 3000 <= score < 5000
    // Range 3: 5000 <= score < 7000
    // Range 4: 7000 <= score < 10000
    // Range 5: score >= 10000
    
    component range_checks[6];
    signal range_indicators[6];
    
    // Check each range
    range_checks[0] = LessThan(20);
    range_checks[0].in[0] <== score;
    range_checks[0].in[1] <== 1000;
    range_indicators[0] <== range_checks[0].out;
    
    range_checks[1] = LessThan(20);
    range_checks[1].in[0] <== score;
    range_checks[1].in[1] <== 3000;
    
    range_checks[2] = LessThan(20);
    range_checks[2].in[0] <== score;
    range_checks[2].in[1] <== 5000;
    
    range_checks[3] = LessThan(20);
    range_checks[3].in[0] <== score;
    range_checks[3].in[1] <== 7000;
    
    range_checks[4] = LessThan(20);
    range_checks[4].in[0] <== score;
    range_checks[4].in[1] <== 10000;
    
    // Calculate range indicators
    range_indicators[1] <== range_checks[1].out - range_indicators[0];
    range_indicators[2] <== range_checks[2].out - range_checks[1].out;
    range_indicators[3] <== range_checks[3].out - range_checks[2].out;
    range_indicators[4] <== range_checks[4].out - range_checks[3].out;
    range_indicators[5] <== 1 - range_checks[4].out;
    
    // Compute final range
    signal range_products[6];
    signal range_partial_sums[6];
    
    for (var i = 0; i < 6; i++) {
        range_products[i] <== i * range_indicators[i];
    }
    
    range_partial_sums[0] <== range_products[0];
    for (var i = 1; i < 6; i++) {
        range_partial_sums[i] <== range_partial_sums[i-1] + range_products[i];
    }
    
    // Only reveal range if match is true (additional privacy)
    range <== range_partial_sums[5] * is_match;
}

// =============================================================================
// INTEREST UPDATE CIRCUIT  
// Allows users to update interests while maintaining commitment continuity
// =============================================================================

template InterestUpdate(n) {
    // Private inputs
    signal input old_interests[n];
    signal input new_interests[n];
    signal input old_salt;
    signal input new_salt;
    
    // Public inputs
    signal input old_commitment;
    signal input max_change_per_interest; // Maximum allowed change per update
    
    // Public outputs
    signal output new_commitment;
    signal output update_valid;
    
    // Verify old commitment
    component old_hasher = Poseidon(n + 1);
    for (var i = 0; i < n; i++) {
        old_hasher.inputs[i] <== old_interests[i];
    }
    old_hasher.inputs[n] <== old_salt;
    
    component old_commitment_check = IsEqual();
    old_commitment_check.in[0] <== old_hasher.out;
    old_commitment_check.in[1] <== old_commitment;
    
    // Validate changes are within allowed bounds
    component change_validators[n];
    component change_calculators[n];
    component range_checkers[n];
    
    for (var i = 0; i < n; i++) {
        // Calculate absolute change
        change_calculators[i] = AbsoluteDifference();
        change_calculators[i].a <== old_interests[i];
        change_calculators[i].b <== new_interests[i];
        
        // Validate change is within bounds
        change_validators[i] = LessEqThan(10);
        change_validators[i].in[0] <== change_calculators[i].diff;
        change_validators[i].in[1] <== max_change_per_interest;
        
        // Validate new interest is in valid range
        range_checkers[i] = LessEqThan(7);
        range_checkers[i].in[0] <== new_interests[i];
        range_checkers[i].in[1] <== 100;
        range_checkers[i].out === 1;
    }
    
    // Generate new commitment
    component new_hasher = Poseidon(n + 1);
    for (var i = 0; i < n; i++) {
        new_hasher.inputs[i] <== new_interests[i];
    }
    new_hasher.inputs[n] <== new_salt;
    
    new_commitment <== new_hasher.out;
    
    // Validate update is legitimate
    var all_changes_valid = 1;
    for (var i = 0; i < n; i++) {
        all_changes_valid *= change_validators[i].out;
    }
    
    update_valid <== old_commitment_check.out * all_changes_valid;
}

// =============================================================================
// HELPER CIRCUITS
// =============================================================================

template AbsoluteDifference() {
    signal input a;
    signal input b;
    signal output diff;
    
    component lt = LessThan(32);
    lt.in[0] <== a;
    lt.in[1] <== b + 1;
    
    diff <== lt.out * (b - a) + (1 - lt.out) * (a - b);
}

// =============================================================================
// MAIN CIRCUIT FOR COMPILATION
// =============================================================================

// Main circuit uses InterestMatcher as it's the most comprehensive
component main = InterestMatcher(15);
