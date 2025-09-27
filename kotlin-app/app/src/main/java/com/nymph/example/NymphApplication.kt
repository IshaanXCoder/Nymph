package com.nymph.example

import android.app.Application
import android.util.Log
import com.nymph.example.services.ClerkAuthService

class NymphApplication : Application() {
    
    companion object {
        private const val TAG = "NymphApplication"
        // TODO: Replace with your actual Clerk publishable key
        private const val CLERK_PUBLISHABLE_KEY = "pk_test_your_key_here"
    }
    
    override fun onCreate() {
        super.onCreate()
        
        try {
            // Initialize Clerk authentication
            ClerkAuthService.initialize(this, CLERK_PUBLISHABLE_KEY)
            Log.d(TAG, "Nymph application initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Nymph application", e)
        }
    }
}
