import { describe, it, expect } from "vitest";
import { sessionCookieOptions, isSameOrigin } from "./auth-security";

/**
 * The session cookie is the only real XSS mitigation the app has — the audit
 * found the token was also handed to `localStorage`, which makes a cookie
 * without `secure`/`sameSite` decorative rather than protective.
 */

describe("sessionCookieOptions", () => {
  it("marks the cookie httpOnly so script cannot read it", () => {
    expect(sessionCookieOptions(60).httpOnly).toBe(true);
  });

  it("marks the cookie secure so it is never sent over plaintext", () => {
    expect(sessionCookieOptions(60).secure).toBe(true);
  });

  it("sets sameSite so a cross-site form POST cannot carry it", () => {
    const options = sessionCookieOptions(60);
    expect(options.sameSite).toBe("lax");
  });

  it("scopes the cookie to the whole site and honours the max age", () => {
    const options = sessionCookieOptions(120);
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(120);
  });
});

describe("isSameOrigin", () => {
  it("accepts a request from the site's own origin", () => {
    expect(isSameOrigin("https://futurebite.example", "futurebite.example")).toBe(
      true
    );
  });

  it("accepts the same host over plain http, which local dev uses", () => {
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
  });

  it("rejects a cross-site origin", () => {
    expect(isSameOrigin("https://evil.example", "futurebite.example")).toBe(
      false
    );
  });

  it("rejects a look-alike host that merely ends with the real one", () => {
    expect(
      isSameOrigin("https://futurebite.example.evil.com", "futurebite.example")
    ).toBe(false);
  });

  it("rejects a different port on the same host", () => {
    expect(isSameOrigin("https://localhost:4000", "localhost:3000")).toBe(false);
  });

  it("allows a request with no Origin header, which is not a browser", () => {
    // Server-side fetch and curl send no Origin. Browsers always send one on a
    // cross-site POST, so an absent header is not a CSRF attempt.
    expect(isSameOrigin(null, "futurebite.example")).toBe(true);
  });
});