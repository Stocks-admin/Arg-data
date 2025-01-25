declare module "../helpers/iolHelper.js" {
  export function loginToIOL(): Promise<{
    access_token: string;
    expires_at: string;
  }>;
}
