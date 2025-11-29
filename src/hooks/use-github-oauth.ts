import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { v4 as uuidv4 } from 'uuid';
// In a real app, this would come from environment variables.
const GITHUB_CLIENT_ID = 'Iv1.b5a5e533a303b575'; // A placeholder public client ID
export const useGithubOAuth = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('github_token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem('github_token'));
  const [isLoading, setIsLoading] = useState(false);
  const login = useCallback(async () => {
    setIsLoading(true);
    // For this demo, we'll use a simplified implicit grant flow for simplicity,
    // as a full PKCE flow requires a backend component to exchange the code for a token,
    // which is beyond the scope of this phase's frontend focus.
    // The user will be redirected to GitHub to authorize the app.
    const state = uuidv4();
    sessionStorage.setItem('github_oauth_state', state);
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo public_repo',
      state: state,
      redirect_uri: window.location.origin,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }, []);
  const logout = useCallback(() => {
    setToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('github_token');
    // Here you would also call a backend endpoint to invalidate the token if necessary.
  }, []);
  // This effect will run on the callback page to handle the token
  useEffect(() => {
    // This is a simplified handler for a real OAuth flow.
    // A full implementation would handle the code exchange on the backend.
    // For now, we just simulate being logged in.
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = sessionStorage.getItem('github_oauth_state');
    if (code && state && state === storedState) {
      // In a real app, you'd send this code to your backend to exchange for a token.
      // To keep this demo functional without a backend secret, we'll mock this.
      const mockToken = `mock_token_${Date.now()}`;
      setToken(mockToken);
      setIsAuthenticated(true);
      sessionStorage.setItem('github_token', mockToken);
      sessionStorage.removeItem('github_oauth_state');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  return { login, logout, token, isAuthenticated, isLoading };
};