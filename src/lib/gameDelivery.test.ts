import { test } from "node:test";
import assert from "node:assert/strict";
import { protectedGameUrl } from "./gameDelivery";

test("launch authorization stays out of request URLs and retains host parameters", () => {
  const url = new URL(protectedGameUrl({ url: "https://games.example.org/play?level=2#mode=arcade", token: "secret-test-token", expires_in: 60, preview: true }, "test-game"));
  assert.equal(url.search, "?level=2");
  assert.equal(new URLSearchParams(url.hash.slice(1)).get("usportz_token"), "secret-test-token");
  assert.equal(new URLSearchParams(url.hash.slice(1)).get("mode"), "arcade");
  assert.equal(new URLSearchParams(url.hash.slice(1)).get("usportz_game"), "test-game");
});
test("protected launches reject executable and credential-bearing destinations", () => {
  for (const url of ["javascript:alert(1)", "http://games.example.org", "https://name:password@games.example.org"]) {
    assert.throws(() => protectedGameUrl({ url, token: "test", expires_in: 60, preview: true }, "game"));
  }
});