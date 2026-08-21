import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSignupProfile, profileFromAuthMetadata } from "./signup-profile";

test("signup profile accepts a catalog country, mobile, and address", () => {
  const result = normalizeSignupProfile({
    country: "kw",
    address: "Salem Al Mubarak St, Salmiya",
    mobilePhone: "+965 5000 0000",
  });
  assert.deepEqual(result.profile, {
    country: "KW",
    address: "Salem Al Mubarak St, Salmiya",
    mobilePhone: "+96550000000",
  });
});

test("signup profile rejects an unknown country", () => {
  const result = normalizeSignupProfile({
    country: "XX",
    address: "Salem Al Mubarak St, Salmiya",
    mobilePhone: "+96550000000",
  });
  assert.match(result.error || "", /country/i);
});

test("auth metadata maps onto the account profile", () => {
  assert.deepEqual(profileFromAuthMetadata({
    country: "EG",
    address: "Cairo Downtown",
    mobile: "+201000000000",
  }), {
    country: "EG",
    address: "Cairo Downtown",
    mobilePhone: "+201000000000",
  });
});
