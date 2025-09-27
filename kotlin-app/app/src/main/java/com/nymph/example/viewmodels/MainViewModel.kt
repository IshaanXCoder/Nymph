package com.nymph.example.viewmodels

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nymph.example.services.ClerkAuthService
import com.nymph.example.services.MoproService
import com.nymph.example.services.UserInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
    
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()
    
    private val _currentUser = MutableStateFlow<String?>(null)
    val currentUser: StateFlow<String?> = _currentUser.asStateFlow()
    
    private val _proofResults = MutableStateFlow<List<String>>(emptyList())
    val proofResults: StateFlow<List<String>> = _proofResults.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    private var currentUserInfo: UserInfo? = null
    
    companion object {
        private const val TAG = "MainViewModel"
    }
    
    init {
        checkAuthenticationStatus()
    }
    
    private fun checkAuthenticationStatus() {
        viewModelScope.launch {
            try {
                val isSignedIn = ClerkAuthService.isSignedIn()
                _isAuthenticated.value = isSignedIn
                
                if (isSignedIn) {
                    val user = ClerkAuthService.getCurrentUser()
                    currentUserInfo = user
                    _currentUser.value = user?.email ?: "Unknown User"
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to check authentication status", e)
                _errorMessage.value = "Failed to check authentication status"
            }
        }
    }
    
    suspend fun signInWithGoogle(context: Context): Boolean {
        return try {
            _isLoading.value = true
            _errorMessage.value = null
            
            val result = ClerkAuthService.signInWithGoogle(context)
            
            if (result.success && result.user != null) {
                currentUserInfo = result.user
                _isAuthenticated.value = true
                _currentUser.value = result.user.email
                Log.d(TAG, "Google sign-in successful for user: ${result.user.email}")
                true
            } else {
                _errorMessage.value = result.error ?: "Google sign-in failed"
                Log.e(TAG, "Google sign-in failed: ${result.error}")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Google sign-in error", e)
            _errorMessage.value = "Google sign-in error: ${e.message}"
            false
        } finally {
            _isLoading.value = false
        }
    }
    
    suspend fun signInWithMicrosoft(context: Context): Boolean {
        return try {
            _isLoading.value = true
            _errorMessage.value = null
            
            val result = ClerkAuthService.signInWithMicrosoft(context)
            
            if (result.success && result.user != null) {
                currentUserInfo = result.user
                _isAuthenticated.value = true
                _currentUser.value = result.user.email
                Log.d(TAG, "Microsoft sign-in successful for user: ${result.user.email}")
                true
            } else {
                _errorMessage.value = result.error ?: "Microsoft sign-in failed"
                Log.e(TAG, "Microsoft sign-in failed: ${result.error}")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Microsoft sign-in error", e)
            _errorMessage.value = "Microsoft sign-in error: ${e.message}"
            false
        } finally {
            _isLoading.value = false
        }
    }
    
    suspend fun signOut() {
        try {
            _isLoading.value = true
            
            val success = ClerkAuthService.signOut()
            
            if (success) {
                _isAuthenticated.value = false
                _currentUser.value = null
                currentUserInfo = null
                _proofResults.value = emptyList()
                Log.d(TAG, "Sign-out successful")
            } else {
                _errorMessage.value = "Failed to sign out"
                Log.e(TAG, "Sign-out failed")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Sign-out error", e)
            _errorMessage.value = "Sign-out error: ${e.message}"
        } finally {
            _isLoading.value = false
        }
    }
    
    suspend fun runCircuitTests(context: Context?) {
        if (context == null) {
            _errorMessage.value = "Context required for circuit tests"
            return
        }
        
        try {
            _isLoading.value = true
            _errorMessage.value = null
            
            Log.d(TAG, "Starting circuit tests...")
            
            val testResults = MoproService.runCircuitTests(context)
            val resultMessages = testResults.map { result ->
                if (result.success) {
                    "✅ ${result.message}"
                } else {
                    "❌ ${result.message}"
                }
            }
            
            _proofResults.value = resultMessages
            
            val successCount = testResults.count { it.success }
            val totalCount = testResults.size
            
            Log.d(TAG, "Circuit tests completed: $successCount/$totalCount passed")
            
            if (successCount == totalCount) {
                Log.d(TAG, "All circuit tests passed!")
            } else {
                _errorMessage.value = "Some circuit tests failed ($successCount/$totalCount passed)"
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Circuit tests error", e)
            _errorMessage.value = "Circuit tests failed: ${e.message}"
            _proofResults.value = listOf("❌ Circuit tests failed: ${e.message}")
        } finally {
            _isLoading.value = false
        }
    }
    
    fun clearErrorMessage() {
        _errorMessage.value = null
    }
    
    fun getCurrentUserInfo(): UserInfo? {
        return currentUserInfo
    }
}
