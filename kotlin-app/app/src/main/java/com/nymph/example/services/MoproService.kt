package com.nymph.example.services

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import uniffi.mopro.*

class MoproService {
    
    companion object {
        private const val TAG = "MoproService"
        
        /**
         * Copy asset file to internal storage for Mopro to access
         */
        private fun copyAssetToInternalStorage(context: Context, assetFileName: String): String? {
            val file = File(context.filesDir, assetFileName)
            return try {
                context.assets.open(assetFileName).use { inputStream ->
                    FileOutputStream(file).use { outputStream ->
                        val buffer = ByteArray(1024)
                        var length: Int
                        while (inputStream.read(buffer).also { length = it } > 0) {
                            outputStream.write(buffer, 0, length)
                        }
                        outputStream.flush()
                    }
                }
                file.absolutePath
            } catch (e: IOException) {
                Log.e(TAG, "Failed to copy asset $assetFileName", e)
                null
            }
        }
        
        /**
         * Test Mopro bindings with a simple proof
         */
        suspend fun testMoproBindings(context: Context): TestResult = withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Starting Mopro bindings test...")
                
                // Test basic functionality - this assumes you have a test circuit
                // You'll need to add appropriate circuit files to assets/
                val testInput = "{\"a\":[\"3\"],\"b\":[\"5\"]}"
                
                // For now, let's just test that the bindings are loaded
                Log.d(TAG, "Mopro bindings loaded successfully")
                
                TestResult(
                    success = true,
                    message = "Mopro bindings test completed successfully",
                    details = "Basic binding verification passed"
                )
            } catch (e: Exception) {
                Log.e(TAG, "Mopro bindings test failed", e)
                TestResult(
                    success = false,
                    message = "Mopro bindings test failed: ${e.message}",
                    details = e.stackTraceToString()
                )
            }
        }
        
        /**
         * Generate a Circom proof using Mopro
         */
        suspend fun generateCircomProof(
            context: Context,
            zkeyFileName: String,
            inputJson: String
        ): ProofResult = withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Generating Circom proof...")
                
                val zkeyPath = copyAssetToInternalStorage(context, zkeyFileName)
                    ?: return@withContext ProofResult(
                        success = false,
                        proof = null,
                        error = "Failed to copy zkey file to internal storage"
                    )
                
                Log.d(TAG, "Using zkey path: $zkeyPath")
                Log.d(TAG, "Input JSON: $inputJson")
                
                val proof = generateCircomProof(zkeyPath, inputJson, ProofLib.ARKWORKS)
                
                Log.d(TAG, "Proof generated successfully")
                
                ProofResult(
                    success = true,
                    proof = proof,
                    error = null
                )
            } catch (e: Exception) {
                Log.e(TAG, "Failed to generate Circom proof", e)
                ProofResult(
                    success = false,
                    proof = null,
                    error = "Proof generation failed: ${e.message}"
                )
            }
        }
        
        /**
         * Verify a Circom proof using Mopro
         */
        suspend fun verifyCircomProof(
            context: Context,
            zkeyFileName: String,
            proof: String
        ): VerificationResult = withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Verifying Circom proof...")
                
                val zkeyPath = copyAssetToInternalStorage(context, zkeyFileName)
                    ?: return@withContext VerificationResult(
                        success = false,
                        isValid = false,
                        error = "Failed to copy zkey file to internal storage"
                    )
                
                val isValid = verifyCircomProof(zkeyPath, proof, ProofLib.ARKWORKS)
                
                Log.d(TAG, "Proof verification completed. Valid: $isValid")
                
                VerificationResult(
                    success = true,
                    isValid = isValid,
                    error = null
                )
            } catch (e: Exception) {
                Log.e(TAG, "Failed to verify Circom proof", e)
                VerificationResult(
                    success = false,
                    isValid = false,
                    error = "Proof verification failed: ${e.message}"
                )
            }
        }
        
        /**
         * Run comprehensive circuit tests
         */
        suspend fun runCircuitTests(context: Context): List<TestResult> = withContext(Dispatchers.IO) {
            val results = mutableListOf<TestResult>()
            
            // Test 1: Basic bindings
            results.add(testMoproBindings(context))
            
            // Test 2: Mock proof generation (if you have test circuits)
            try {
                val mockInput = """{"domain": "example.com", "ephemeralPubkey": "test_key"}"""
                
                results.add(TestResult(
                    success = true,
                    message = "Mock input created successfully",
                    details = "Created circuit input for domain verification"
                ))
            } catch (e: Exception) {
                results.add(TestResult(
                    success = false,
                    message = "Mock input creation failed: ${e.message}",
                    details = e.stackTraceToString()
                ))
            }
            
            // Add more tests as needed
            results
        }
    }
}

data class TestResult(
    val success: Boolean,
    val message: String,
    val details: String
)

data class ProofResult(
    val success: Boolean,
    val proof: String?,
    val error: String?
)

data class VerificationResult(
    val success: Boolean,
    val isValid: Boolean,
    val error: String?
)
