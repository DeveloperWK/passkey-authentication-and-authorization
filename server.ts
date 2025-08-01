import express from "express";
import cors from "cors";
import {
  AuthenticationResponseJSON,
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  RegistrationResponseJSON,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
  WebAuthnCredential,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import session from "express-session";
import memoryStore from "memorystore";
import type { LoggedInUser } from "./types.d.ts";
const app = express();
const MemoryStore = memoryStore(session);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(
  session({
    /*
    It's just for development purposes,
    not for production please use a secure secret in production,
    and store it securely on env variable
    */
    secret: "secret123",
    saveUninitialized: true,
    resave: false,
    cookie: {
      maxAge: 86400000,
    },
    store: new MemoryStore({
      checkPeriod: 86_400_000,
    }),
  }),
);
const rpName = "FIDO2 DEMO";
const rpID = "localhost";
const origin = "http://localhost:5173";

const loggedInUserId = "internalUserId";

const inMemoryUserDB: { [loggedInUserId: string]: LoggedInUser } = {
  [loggedInUserId]: {
    id: loggedInUserId,
    username: `user@${rpID}`,
    credentials: [],
  },
};
// Registration Options
app.get("/generate-registration-options", async (req, res) => {
  const user = inMemoryUserDB[loggedInUserId];
  const { username, credentials } = user;
  const opts: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userName: username,
    timeout: 60000,
    attestationType: "none",
    userDisplayName: username,
    excludeCredentials: credentials.map((cred) => ({
      id: cred.id,
      type: "public-key",
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
  };
  const options = await generateRegistrationOptions(opts);

  req.session.currentChallenge = options.challenge;
  res.json(options);
});

// Registration Verification
app.post("/verify-registration", async (req, res) => {
  const { username, attestationResponse } = req.body;
  const user = inMemoryUserDB[loggedInUserId];

  const expectedChallenge = req.session.currentChallenge;
  console.log("Challenge:", expectedChallenge);
  let verification: VerifiedRegistrationResponse;
  try {
    const opts: VerifyRegistrationResponseOpts = {
      response: attestationResponse,
      expectedChallenge: expectedChallenge as string,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    };
    verification = await verifyRegistrationResponse(opts);
  } catch (error) {
    const _error = error as Error;
    console.error(_error);
    return res.status(400).send({ error: _error.message });
  }
  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credential } = registrationInfo;

    const existingCredential = user.credentials.find(
      (cred) => cred.id === credential.id,
    );
    if (!existingCredential) {
      const newCredential = {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: attestationResponse.response.transports,
      };
      user.credentials.push(newCredential);
    }
  }
  req.session.currentChallenge = undefined;
  res.json({ verified: true });
});
app.get("/generate-authentication-options", async (req, res) => {
  const user = inMemoryUserDB[loggedInUserId];
  if (!user || user.credentials.length === 0) {
    return res.status(400).json({ error: "No credentials found for user" });
  }

  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,

    allowCredentials: [
      {
        id: user.credentials[0].id,
        transports: ["internal"],
      },
    ],
    userVerification: "preferred",
    rpID,
  };
  const options = await generateAuthenticationOptions(opts);
  req.session.currentChallenge = options.challenge;
  res.json({ options });
});
app.post("/verify-authentication", async (req, res) => {
  const {
    assertionResponse,
  }: { assertionResponse: AuthenticationResponseJSON } = req.body;
  const credentialID = assertionResponse.rawId || assertionResponse.id;
  console.log(credentialID);
  const user = inMemoryUserDB[loggedInUserId];
  const expectedChallenge = req.session.currentChallenge;
  let dbCredential: WebAuthnCredential | undefined;
  for (const cred of user.credentials) {
    if (cred.id === credentialID) {
      dbCredential = cred;
      break;
    }
  }
  if (!dbCredential) {
    return res.status(400).send({
      error: "Authenticator is not registered with this site",
    });
  }
  let verification: VerifiedAuthenticationResponse;
  try {
    const opts: VerifyAuthenticationResponseOpts = {
      response: assertionResponse,
      expectedChallenge: expectedChallenge as string,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: dbCredential,
      requireUserVerification: false,
    };
    verification = await verifyAuthenticationResponse(opts);
  } catch (error) {
    const _error = error as Error;
    console.error(_error);
    return res.status(400).send({ error: _error.message });
  }
  const { verified, authenticationInfo } = verification;
  if (verified) {
    dbCredential.counter = authenticationInfo.newCounter;
  }
  req.session.currentChallenge = undefined;
  res.json({ verified });
});

app.listen(4000, () => {
  console.log("FIDO2 server running on http://localhost:4000");
});
