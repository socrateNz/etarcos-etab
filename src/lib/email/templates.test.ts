import { describe, expect, it } from "vitest";
import { welcomeEmail, passwordResetEmail } from "./templates";

describe("welcomeEmail", () => {
  const params = { name: "Jean Dupont", email: "jean@example.com", tempPassword: "Tmp!23456789" };

  it("includes the recipient's credentials in both html and text bodies", () => {
    const { html, text } = welcomeEmail(params);
    expect(html).toContain(params.email);
    expect(html).toContain(params.tempPassword);
    expect(text).toContain(params.email);
    expect(text).toContain(params.tempPassword);
  });

  it("has a non-empty subject", () => {
    expect(welcomeEmail(params).subject.length).toBeGreaterThan(0);
  });
});

describe("passwordResetEmail", () => {
  const params = { name: "Jean Dupont", email: "jean@example.com", tempPassword: "Tmp!23456789" };

  it("includes the recipient's new credentials in both html and text bodies", () => {
    const { html, text } = passwordResetEmail(params);
    expect(html).toContain(params.email);
    expect(html).toContain(params.tempPassword);
    expect(text).toContain(params.email);
    expect(text).toContain(params.tempPassword);
  });

  it("warns the recipient to contact their admin if they didn't request the reset", () => {
    const { html, text } = passwordResetEmail(params);
    expect(html.toLowerCase()).toContain("n'êtes pas à l'origine");
    expect(text.toLowerCase()).toContain("n'êtes pas à l'origine");
  });
});
