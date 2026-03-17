const SESSION_KEY = 'kalamkas_auth'
const CREDENTIALS: Record<string, string> = { admin: 'kalamkas2024', operator: 'operator123' }

export function login(username: string, password: string): boolean {
  if (CREDENTIALS[username] === password) {
    sessionStorage.setItem(SESSION_KEY, username)
    return true
  }
  return false
}
export function logout() { sessionStorage.removeItem(SESSION_KEY) }
export function getCurrentUser(): string | null { return sessionStorage.getItem(SESSION_KEY) }
export function isLoggedIn(): boolean { return !!sessionStorage.getItem(SESSION_KEY) }
