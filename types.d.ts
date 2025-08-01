import { WebAuthnCredential } from "@simplewebauthn/server";

interface LoggedInUser {
  id: string;
  username: string;
  credentials: WebAuthnCredential[];
}
declare module "express-session" {
  interface SessionData {
    currentChallenge?: string;
  }
}

export { LoggedInUser };
