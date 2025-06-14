import { useState, useCallback } from 'react';

export function useApiToken() {
  const [token, setToken] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    if (token) return token;

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        return data.token;
      }
    } catch (error) {
      console.error('Failed to get API token:', error);
    }

    return null;
  }, [token]);

  return { getToken };
}
