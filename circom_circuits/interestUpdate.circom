pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

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
    
    signal diff_ba <== b - a;
    signal diff_ab <== a - b;
    signal not_lt <== 1 - lt.out;
    
    signal term1 <== lt.out * diff_ba;
    signal term2 <== not_lt * diff_ab;
    
    diff <== term1 + term2;
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
    
    // Validate update is legitimate - compute AND of all validators
    signal validator_products[n];
    
    validator_products[0] <== change_validators[0].out;
    for (var i = 1; i < n; i++) {
        validator_products[i] <== validator_products[i-1] * change_validators[i].out;
    }
    
    update_valid <== old_commitment_check.out * validator_products[n-1];
}

// =============================================================================
// MAIN CIRCUIT FOR COMPILATION
// =============================================================================

component main = InterestUpdate(15);