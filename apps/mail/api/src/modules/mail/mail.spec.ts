import assert from "node:assert/strict";
import test from "node:test";
import { decryptMailSecret, encryptMailSecret } from "./mail.secrets.js";
import { shouldImportInboundMessage } from "./mail.sync.js";

test("tenant mail secrets round-trip without persisting plaintext", () => {
  const plaintext = "tenant-smtp-password";
  const encrypted = encryptMailSecret(plaintext, "test-secret-key");

  assert.notEqual(encrypted, plaintext);
  assert.match(encrypted, /^v1\./);
  assert.equal(decryptMailSecret(encrypted, "test-secret-key"), plaintext);
});

test("inbound synchronization rejects provider duplicates", () => {
  const known = new Set(["provider-message-1"]);

  assert.equal(shouldImportInboundMessage("provider-message-1", known), false);
  assert.equal(shouldImportInboundMessage("provider-message-2", known), true);
  assert.equal(shouldImportInboundMessage("", known), false);
});
