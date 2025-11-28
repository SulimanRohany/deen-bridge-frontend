// Authentication utility functions

export const getAuthTokens = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const tokens = localStorage.getItem('authTokens');
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const isAuthenticated = () => {
  const tokens = getAuthTokens();
  if (!tokens || !tokens.access) return false;
  
  return !isTokenExpired(tokens.access);
};

export const getTokenInfo = () => {
  const tokens = getAuthTokens();
  if (!tokens || !tokens.access) return null;
  
  try {
    const payload = JSON.parse(atob(tokens.access.split('.')[1]));
    return {
      user: payload.user,
      exp: payload.exp,
      iat: payload.iat,
      expiresIn: Math.max(0, payload.exp - Date.now() / 1000),
      isExpired: isTokenExpired(tokens.access)
    };
  } catch (error) {
    return null;
  }
};

export const logAuthStatus = () => {
  const tokens = getAuthTokens();
  const tokenInfo = getTokenInfo();
  
};
