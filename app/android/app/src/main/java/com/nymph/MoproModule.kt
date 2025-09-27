package com.nymph

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import uniffi.mopro.moproUniffiHelloWorld
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@ReactModule(name = MoproModule.NAME)
class MoproModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        const val NAME = "MoproModule"
    }

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun moproUniffiHelloWorld(promise: Promise) {
        try {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val result = moproUniffiHelloWorld()
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject("MOPRO_ERROR", "Failed to call mopro hello world: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("MOPRO_ERROR", "Failed to initialize mopro call: ${e.message}", e)
        }
    }

    // Placeholder for future proof generation functions
    @ReactMethod
    fun generateJWTProof(inputJson: String, promise: Promise) {
        try {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    // For now, just return a mock proof with the hello world function
                    val greeting = moproUniffiHelloWorld()
                    val mockProof = "jwt_proof_${System.currentTimeMillis()}_$greeting"
                    promise.resolve(mockProof)
                } catch (e: Exception) {
                    promise.reject("PROOF_GENERATION_ERROR", "Failed to generate JWT proof: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("PROOF_GENERATION_ERROR", "Failed to initialize proof generation: ${e.message}", e)
        }
    }

    @ReactMethod
    fun verifyJWTProof(proof: String, promise: Promise) {
        try {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    // Basic verification - check if it's a valid proof format
                    val isValid = proof.startsWith("jwt_proof_") && proof.contains("Hello, World!")
                    promise.resolve(isValid)
                } catch (e: Exception) {
                    promise.reject("PROOF_VERIFICATION_ERROR", "Failed to verify JWT proof: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("PROOF_VERIFICATION_ERROR", "Failed to initialize proof verification: ${e.message}", e)
        }
    }
}
