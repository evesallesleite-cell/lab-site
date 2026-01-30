import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../../components/header"), { ssr: false });

export default function WhoopLogin() {
  const [loginUrl, setLoginUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate the Whoop OAuth login URL
    const clientId = "c0e2136e-6968-416e-a5d1-89688b240ae2";
    const redirectUri = encodeURIComponent("http://localhost:3000/redirect");
    const scope = encodeURIComponent("offline read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement");
    const state = Math.random().toString(36).substring(2, 15);
    
    localStorage.setItem("whoop_oauth_state", state);
    
    const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    setLoginUrl(authUrl);
  }, []);

  const handleLogin = () => {
    if (loginUrl) {
      window.location.href = loginUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Connect to Whoop</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Authenticate with Whoop</h2>
          <p className="text-gray-600 mb-6">
            Click the button below to connect your Whoop account. You'll be redirected to Whoop's website to log in and authorize access to your data.
          </p>
          
          <button
            onClick={handleLogin}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Connect to Whoop
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-blue-800 font-semibold mb-2">What data will be accessed?</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Profile information (name, email)</li>
            <li>• Body measurements (height, weight)</li>
            <li>• Sleep data and scores</li>
            <li>• Recovery scores and heart rate data</li>
            <li>• Workout information</li>
            <li>• Physiological cycles</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Next Steps</h3>
          <p className="text-yellow-700">
            After connecting, you'll be redirected back to this site with an access token. 
            That token will be used to fetch your Whoop data and display it on the Whoop dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
