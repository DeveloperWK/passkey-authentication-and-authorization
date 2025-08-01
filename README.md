# WebAuthn Node.js Example

A complete WebAuthn (FIDO2) authentication server implementation using Node.js, Express, and the SimpleWebAuthn library. This project demonstrates passwordless authentication using biometric authentication, security keys, and platform authenticators.

## Features

- **Passwordless Authentication**: Complete WebAuthn implementation for registration and authentication
- **FIDO2 Compliant**: Uses the latest WebAuthn standards
- **Biometric Support**: Works with fingerprint, face recognition, and other biometric authenticators
- **Security Keys**: Compatible with hardware security keys (YubiKey, etc.)
- **Platform Authenticators**: Supports built-in authenticators (Windows Hello, Touch ID, etc.)
- **Session Management**: Express session handling with memory store
- **CORS Support**: Configured for frontend integration

## Prerequisites

- Node.js (v16 or higher)
- npm or pnpm package manager
- A modern browser with WebAuthn support
- HTTPS connection (required for WebAuthn in production)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd webauthn-node-example
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Build the project:
```bash
pnpm build
# or
npm run build
```

## Usage

### Development Mode

Start the server in development mode with hot reload:

```bash
pnpm dev
# or
npm run dev
```

### Production Mode

Build and start the production server:

```bash
pnpm build && pnpm start
# or
npm run build && npm start
```

The server will start on `http://localhost:4000`

## API Endpoints

### Registration

#### GET `/generate-registration-options`

Generates registration options for a new WebAuthn credential.

**Response:**
```json
{
  "rp": { "name": "FIDO2 DEMO", "id": "localhost" },
  "user": { "id": "...", "name": "user@localhost", "displayName": "user@localhost" },
  "challenge": "...",
  "pubKeyCredParams": [...],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [...],
  "authenticatorSelection": {
    "residentKey": "preferred",
    "userVerification": "required"
  }
}
```

#### POST `/verify-registration`

Verifies the registration response from the authenticator.

**Request Body:**
```json
{
  "username": "user@localhost",
  "attestationResponse": {
    "id": "...",
    "rawId": "...",
    "response": {
      "attestationObject": "...",
      "clientDataJSON": "..."
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "verified": true
}
```

### Authentication

#### GET `/generate-authentication-options`

Generates authentication options for existing credentials.

**Response:**
```json
{
  "options": {
    "challenge": "...",
    "timeout": 60000,
    "rpId": "localhost",
    "allowCredentials": [...],
    "userVerification": "preferred"
  }
}
```

#### POST `/verify-authentication`

Verifies the authentication response from the authenticator.

**Request Body:**
```json
{
  "assertionResponse": {
    "id": "...",
    "rawId": "...",
    "response": {
      "authenticatorData": "...",
      "clientDataJSON": "...",
      "signature": "..."
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "verified": true
}
```

## Configuration

The server is configured with the following settings:

- **Relying Party Name**: "FIDO2 DEMO"
- **Relying Party ID**: "localhost"
- **Origin**: "http://localhost:5173"
- **Timeout**: 60 seconds
- **User Verification**: Required for registration, preferred for authentication
- **Resident Key**: Preferred

### Environment Variables

For production deployment, consider using environment variables:

```bash
RP_NAME="Your App Name"
RP_ID="yourdomain.com"
ORIGIN="https://yourdomain.com"
SESSION_SECRET="your-secure-session-secret"
PORT=4000
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **HTTPS Required**: WebAuthn requires HTTPS in production (except for localhost)
2. **Session Secret**: Change the hardcoded session secret in production
3. **Origin Validation**: Ensure the origin matches your frontend domain
4. **Database**: Replace the in-memory storage with a proper database
5. **User Management**: Implement proper user authentication and authorization

## Database Schema

The in-memory user database structure:

```typescript
interface LoggedInUser {
  id: string;
  username: string;
  credentials: WebAuthnCredential[];
}

interface WebAuthnCredential {
  id: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransport[];
}
```

## Frontend Integration

This server is designed to work with a WebAuthn frontend client. Expected frontend origin: `http://localhost:5173`

Example frontend flow:
1. Call `/generate-registration-options` to get registration options
2. Use `startRegistration() import from @simplewebauthn/browser ` with the options
3. Send the credential to `/verify-registration`
4. For authentication, call `/generate-authentication-options`
5. Use `startAuthentication() import from @simplewebauthn/browser ` with the options
6. Send the assertion to `/verify-authentication`

## Dependencies

- **@simplewebauthn/server**: WebAuthn server-side verification
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **express-session**: Session management
- **memorystore**: Memory-based session store

## Browser Compatibility

WebAuthn is supported in:
- Chrome 67+
- Firefox 60+
- Safari 14+
- Edge 18+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Resources

- [WebAuthn Guide](https://webauthn.guide/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [W3C WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [FIDO Alliance](https://fidoalliance.org/)
