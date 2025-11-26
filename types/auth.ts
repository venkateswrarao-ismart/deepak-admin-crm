export type StoredAuthData = {
  user?: {
    id: string
    email?: string
    role?: string
  }
  access_token?: string
  refresh_token?: string
}
