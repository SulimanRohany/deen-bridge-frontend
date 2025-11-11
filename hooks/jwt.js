export function getJWTToken() {
  if (typeof window !== 'undefined') {
    const authTokens = localStorage.getItem('authTokens')
    if (authTokens) {
      try {
        const tokens = JSON.parse(authTokens)
        if (tokens.access) {
          return tokens.access
        }
      } catch {}
    }
  }
  return null
}
