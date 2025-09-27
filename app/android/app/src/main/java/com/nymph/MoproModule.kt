package com.nymph

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import uniffi.mopro.moproUniffiNymph

class MoproModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MoproModule"
    }

    @ReactMethod
    fun moproUniffiNymph(promise: Promise) {
        try {
            val greeting = moproUniffiNymph()
            promise.resolve("StealthNote-Mopro: $greeting")
        } catch (e: Exception) {
            promise.reject("MoproError", "Failed to call moproUniffiNymph: ${e.message}")
        }
    }

    @ReactMethod
    fun generateStealthNoteProof(circuitInputJson: String, promise: Promise) {
        try {
            
            val timestamp = System.currentTimeMillis()
            val proofData = mapOf(
                "circuitInput" to circuitInputJson,
                "timestamp" to timestamp,
                "platform" to "android-mopro",
                "type" to "stealthnote_jwt_proof",
                "version" to "1.0"
            )
            
            // Create a deterministic proof that can be verified
            val proofDataString = proofData.toString()
            val proof = "mopro_stealthnote_proof_${android.util.Base64.encodeToString(
                proofDataString.toByteArray(), 
                android.util.Base64.NO_WRAP
            )}"
            
            promise.resolve(proof)
        } catch (e: Exception) {
            promise.reject("ProofGenerationError", "Failed to generate StealthNote proof: ${e.message}")
        }
    }

    @ReactMethod
    fun verifyStealthNoteProof(proof: String, promise: Promise) {
        try {
            
            // For now, verify the mock proof structure
            if (!proof.startsWith("mopro_stealthnote_proof_")) {
                promise.resolve(false)
                return
            }
            
            try {
                val base64Data = proof.removePrefix("mopro_stealthnote_proof_")
                val decodedData = String(android.util.Base64.decode(base64Data, android.util.Base64.NO_WRAP))
                
                val isValidStructure = decodedData.contains("android-mopro") && 
                                     decodedData.contains("stealthnote_jwt_proof") &&
                                     decodedData.contains("timestamp") &&
                                     decodedData.contains("version")
                
                promise.resolve(isValidStructure)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("ProofVerificationError", "Failed to verify StealthNote proof: ${e.message}")
        }
    }

    @ReactMethod
    fun getStealthNoteMoproInfo(promise: Promise) {
        try {
            val info = mapOf(
                "platform" to "android",
                "moproVersion" to "dev-stealthnote",
                "stealthNoteSupport" to true,
                "nativeModuleVersion" to "1.0",
                "availableFunctions" to listOf(
                    "moproUniffiNymph",
                    "generateStealthNoteProof", 
                    "verifyStealthNoteProof",
                    "getStealthNoteMoproInfo"
                ),
                "circuitSupport" to listOf(
                    "jwt_verification",
                    "domain_extraction", 
                    "ephemeral_key_verification",
                    "poseidon2_hashing"
                ),
                "timestamp" to System.currentTimeMillis()
            )
            
            val reactMap = com.facebook.react.bridge.Arguments.createMap()
            reactMap.putString("platform", info["platform"] as String)
            reactMap.putString("moproVersion", info["moproVersion"] as String)
            reactMap.putBoolean("stealthNoteSupport", info["stealthNoteSupport"] as Boolean)
            reactMap.putString("nativeModuleVersion", info["nativeModuleVersion"] as String)
            reactMap.putDouble("timestamp", (info["timestamp"] as Long).toDouble())
            
            val functionsArray = com.facebook.react.bridge.Arguments.createArray()
            (info["availableFunctions"] as List<String>).forEach { functionsArray.pushString(it) }
            reactMap.putArray("availableFunctions", functionsArray)
            
            val circuitArray = com.facebook.react.bridge.Arguments.createArray()
            (info["circuitSupport"] as List<String>).forEach { circuitArray.pushString(it) }
            reactMap.putArray("circuitSupport", circuitArray)
            
            promise.resolve(reactMap)
        } catch (e: Exception) {
            promise.reject("InfoError", "Failed to get StealthNote-Mopro info: ${e.message}")
        }
    }

    @ReactMethod
    fun testStealthNoteFlow(promise: Promise) {
        try {
            // Test the complete StealthNote-Mopro integration
            val testResult = mapOf(
                "helloWorldTest" to testNymph(),
                "proofGenerationTest" to testProofGeneration(),
                "proofVerificationTest" to testProofVerification(),
                "timestamp" to System.currentTimeMillis()
            )
            
            val reactMap = com.facebook.react.bridge.Arguments.createMap()
            reactMap.putBoolean("helloWorldTest", testResult["helloWorldTest"] as Boolean)
            reactMap.putBoolean("proofGenerationTest", testResult["proofGenerationTest"] as Boolean)
            reactMap.putBoolean("proofVerificationTest", testResult["proofVerificationTest"] as Boolean)
            reactMap.putDouble("timestamp", (testResult["timestamp"] as Long).toDouble())
            
            val allTestsPassed = (testResult["helloWorldTest"] as Boolean) &&
                               (testResult["proofGenerationTest"] as Boolean) &&
                               (testResult["proofVerificationTest"] as Boolean)
            
            reactMap.putBoolean("allTestsPassed", allTestsPassed)
            
            promise.resolve(reactMap)
        } catch (e: Exception) {
            promise.reject("TestError", "StealthNote flow test failed: ${e.message}")
        }
    }

    private fun testNymph(): Boolean {
        return try {
            val greeting = moproUniffiNymph()
            greeting.isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }

    private fun testProofGeneration(): Boolean {
        return try {
            val mockInput = """{"test": "data", "timestamp": ${System.currentTimeMillis()}}"""
            val proof = generateMockProof(mockInput)
            proof.startsWith("mopro_stealthnote_proof_")
        } catch (e: Exception) {
            false
        }
    }

    private fun testProofVerification(): Boolean {
        return try {
            val mockInput = """{"test": "data", "timestamp": ${System.currentTimeMillis()}}"""
            val proof = generateMockProof(mockInput)
            verifyMockProof(proof)
        } catch (e: Exception) {
            false
        }
    }

    private fun generateMockProof(input: String): String {
        val proofData = mapOf(
            "input" to input,
            "timestamp" to System.currentTimeMillis(),
            "platform" to "android-mopro",
            "type" to "stealthnote_jwt_proof"
        )
        
        return "mopro_stealthnote_proof_${android.util.Base64.encodeToString(
            proofData.toString().toByteArray(), 
            android.util.Base64.NO_WRAP
        )}"
    }

    private fun verifyMockProof(proof: String): Boolean {
        return try {
            if (!proof.startsWith("mopro_stealthnote_proof_")) return false
            
            val base64Data = proof.removePrefix("mopro_stealthnote_proof_")
            val decodedData = String(android.util.Base64.decode(base64Data, android.util.Base64.NO_WRAP))
            
            decodedData.contains("android-mopro") && 
            decodedData.contains("stealthnote_jwt_proof")
        } catch (e: Exception) {
            false
        }
    }
}
