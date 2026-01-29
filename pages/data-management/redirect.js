import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { getRedirectAfterAuth } from "../../lib/auth-utils";

const Header = dynamic(() => import("../../components/header"), { ssr: false });

export default function Redirect() {
  const router = useRouter();
  const [status, setStatus] = useState("processing");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('whoop_oauth_state');

        if (!code) {
          throw new Error('No authorization code received');
        }

        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for access token
        const response = await fetch('/api/whoop-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const data = await response.json();
        setAccessToken(data.access_token);
        setStatus("success");
        
        // Clean up
        localStorage.removeItem('whoop_oauth_state');
        
        // Get the intended redirect path
        const redirectPath = getRedirectAfterAuth();
        
        // Show success message and redirect to intended page
        alert(`Access token saved! Redirecting to ${redirectPath}...`);
        
        // Redirect to the intended page after 2 seconds
        setTimeout(() => {
          router.push(redirectPath);
        }, 2000);

      } catch (err) {
        setError(err.message);
        setStatus("error");
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Whoop Connection Status</h1>
        
        {status === "processing" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <div>
                <h3 className="text-blue-800 font-semibold">Processing...</h3>
                <p className="text-blue-700">Exchanging authorization code for access token...</p>
              </div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-green-800 font-semibold mb-2">✅ Successfully Connected!</h3>
            <p className="text-green-700 mb-4">
              Your Whoop account has been connected successfully. You'll be redirected to your Whoop dashboard in a few seconds.
            </p>
            <div className="bg-green-100 rounded p-3">
              <p className="text-green-800 text-sm font-mono">
                Access Token: {accessToken.substring(0, 20)}...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">❌ Connection Failed</h3>
            <p className="text-red-700 mb-4">
              There was an error connecting to your Whoop account:
            </p>
            <p className="text-red-800 font-mono bg-red-100 p-3 rounded">
              {error}
            </p>
            <button
              onClick={() => router.push('/whoop-login')}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
