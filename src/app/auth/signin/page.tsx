'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SignIn() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      switch (error) {
        case 'OAuthSignin':
          toast.error('Error constructing an authorization URL');
          break;
        case 'OAuthCallback':
          toast.error('Error handling the OAuth callback');
          break;
        case 'OAuthCreateAccount':
          toast.error('Could not create OAuth account');
          break;
        case 'EmailCreateAccount':
          toast.error('Could not create email account');
          break;
        case 'Callback':
          toast.error('Error in OAuth callback handler');
          break;
        case 'OAuthAccountNotLinked':
          toast.error('This email is already associated with another account. Please sign in with your original provider.');
          break;
        case 'EmailSignin':
          toast.error('Check your email for the sign-in link');
          break;
        case 'CredentialsSignin':
          toast.error('Sign in failed. Check your credentials.');
          break;
        case 'SessionRequired':
          toast.error('Please sign in to access this page');
          break;
        default:
          toast.error('An error occurred during sign in. Please try again.');
      }
    }
  }, [error]);

  const handleSignIn = async (provider: 'google' | 'apple') => {
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (err) {
      toast.error(`Failed to sign in with ${provider === 'google' ? 'Google' : 'Apple'}`);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center drink-pattern-bg">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          Drinking Games
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Play King's Cup, Truth or Dare, and more!
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleSignIn('google')}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={() => handleSignIn('apple')}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Sign in with Apple
          </button>
        </div>
        
        <p className="text-xs text-center text-gray-500 mt-6">
          By signing in, you agree to play responsibly
        </p>
      </div>
    </div>
  );
}
