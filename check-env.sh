#!/bin/bash

# Environment Configuration Checker for Sips
# This script verifies your OAuth configuration is correct

echo "🔍 Checking Sips Environment Configuration..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "   Create it from .env.local.example:"
    echo "   cp .env.local.example .env.local"
    exit 1
fi

echo "✅ .env.local found"
echo ""

# Load environment variables
set -a
source .env.local
set +a

# Check NEXTAUTH_URL
echo "📍 NEXTAUTH_URL Configuration:"
if [ -z "$NEXTAUTH_URL" ]; then
    echo "   ❌ NEXTAUTH_URL is not set!"
    exit 1
else
    echo "   ✅ NEXTAUTH_URL=$NEXTAUTH_URL"
    
    # Determine expected callbacks
    if [[ "$NEXTAUTH_URL" == *"localhost"* ]]; then
        echo "   📌 Running in DEVELOPMENT mode"
        GOOGLE_CALLBACK="$NEXTAUTH_URL/api/auth/callback/google"
        APPLE_CALLBACK="$NEXTAUTH_URL/api/auth/callback/apple"
    else
        echo "   📌 Running in PRODUCTION mode"
        GOOGLE_CALLBACK="$NEXTAUTH_URL/api/auth/callback/google"
        APPLE_CALLBACK="$NEXTAUTH_URL/api/auth/callback/apple"
    fi
fi
echo ""

# Check Google OAuth
echo "🔑 Google OAuth Configuration:"
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "   ❌ GOOGLE_CLIENT_ID is not set!"
else
    echo "   ✅ GOOGLE_CLIENT_ID is set (${#GOOGLE_CLIENT_ID} chars)"
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "   ❌ GOOGLE_CLIENT_SECRET is not set!"
else
    echo "   ✅ GOOGLE_CLIENT_SECRET is set (${#GOOGLE_CLIENT_SECRET} chars)"
fi

echo "   📋 Expected Google Callback URL:"
echo "      $GOOGLE_CALLBACK"
echo "   ⚠️  Add this to Google Cloud Console → Credentials → Authorized redirect URIs"
echo ""

# Check Apple OAuth (optional)
echo "🍎 Apple OAuth Configuration (optional):"
if [ -z "$APPLE_CLIENT_ID" ]; then
    echo "   ⚠️  APPLE_CLIENT_ID is not set (Apple Sign In disabled)"
else
    echo "   ✅ APPLE_CLIENT_ID: $APPLE_CLIENT_ID"
    
    if [ -z "$APPLE_CLIENT_SECRET" ]; then
        echo "   ❌ APPLE_CLIENT_SECRET is not set!"
    else
        echo "   ✅ APPLE_CLIENT_SECRET is set (${#APPLE_CLIENT_SECRET} chars)"
    fi
    
    echo "   📋 Expected Apple Callback URL:"
    echo "      $APPLE_CALLBACK"
    echo "   ⚠️  Add this to Apple Developer Console → Services ID → Return URLs"
fi
echo ""

# Check NEXTAUTH_SECRET
echo "🔐 NextAuth Secret:"
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "   ❌ NEXTAUTH_SECRET is not set!"
    echo "   Generate one with: openssl rand -base64 32"
    exit 1
else
    echo "   ✅ NEXTAUTH_SECRET is set (${#NEXTAUTH_SECRET} chars)"
    if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
        echo "   ⚠️  WARNING: Secret is shorter than recommended (32+ chars)"
    fi
fi
echo ""

# Production specific checks
if [[ "$NEXTAUTH_URL" != *"localhost"* ]]; then
    echo "🚀 Production Deployment Checklist:"
    echo "   □ SSL certificate installed and working"
    echo "   □ Domain pointing to server (dig $NEXTAUTH_URL)"
    echo "   □ Google OAuth redirect URI updated in console"
    echo "   □ Apple OAuth return URL updated in console (if using)"
    echo "   □ NEXTAUTH_SECRET is different from development"
    echo "   □ Environment variables set in production environment"
    echo "   □ Data directory has correct permissions (chmod -R 755 data/)"
    echo ""
fi

echo "✨ Configuration check complete!"
echo ""
echo "Next steps:"
echo "1. If you changed NEXTAUTH_URL, restart your dev server:"
echo "   npm run dev"
echo ""
echo "2. Clear your browser cookies for this site"
echo ""
echo "3. Try signing in again"
echo ""
echo "4. Check the OAuth URLs match in your provider console:"
echo "   Google: https://console.cloud.google.com/apis/credentials"
echo "   Apple: https://developer.apple.com/"
