/** Discord OAuth2 (authorization code + PKCE) — token + user fetch. */

import { createHash, randomBytes } from "node:crypto";

/** RFC 7636 §4.1: 43–128 octets from [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~". */
export function newDiscordPkceCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function discordPkceCodeChallengeS256(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function buildDiscordAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const u = new URL("https://discord.com/api/oauth2/authorize");
  u.searchParams.set("client_id", params.clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "identify");
  u.searchParams.set("state", params.state);
  u.searchParams.set("code_challenge", params.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

export async function exchangeDiscordOAuthCode(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord token exchange failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Discord token response missing access_token");
  }
  return { access_token: json.access_token };
}

export async function fetchDiscordCurrentUser(accessToken: string): Promise<{ id: string }> {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord @me failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { id?: string };
  if (!json.id) {
    throw new Error("Discord @me response missing id");
  }
  return { id: json.id };
}
