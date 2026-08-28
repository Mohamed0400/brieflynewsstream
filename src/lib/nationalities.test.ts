import assert from "node:assert/strict";
import test from "node:test";
import {
  expatNationalityCodesForHost,
  isNationalityAllowedForHost,
  nationalityAudienceLabel,
  nationalityGroupsForHost,
  nationalityOptionsForHost,
  NATIONALITY_OPTIONS,
} from "./nationalities";

test("host country scopes expat nationality options", () => {
  const allCodes = NATIONALITY_OPTIONS.map((option) => option.code);
  assert.deepEqual(nationalityOptionsForHost(undefined).map((option) => option.code), allCodes);
  assert.deepEqual(nationalityOptionsForHost(null).map((option) => option.code), allCodes);

  const saOptions = nationalityOptionsForHost("SA").map((option) => option.code);
  assert.ok(saOptions.includes("PH"));
  assert.ok(saOptions.includes("IN"));
  assert.ok(!saOptions.includes("SA"));

  const deOptions = nationalityOptionsForHost("DE").map((option) => option.code);
  assert.ok(deOptions.includes("TR"));
  assert.ok(!deOptions.includes("DE"));
});

test("Saudi host includes Filipino but not Saudi audience codes", () => {
  const codes = expatNationalityCodesForHost("SA");
  assert.ok(codes?.includes("PH"));
  assert.ok(!codes?.includes("SA"));
  assert.equal(isNationalityAllowedForHost("SA", "PH"), true);
  assert.equal(isNationalityAllowedForHost("SA", "SA"), false);
});

test("Africa group is trimmed to the scoped host set", () => {
  const saGroups = nationalityGroupsForHost("SA");
  const africa = saGroups.find((group) => group.code === "AFRICA");
  assert.ok(africa);
  assert.deepEqual(africa?.countryCodes, ["EG", "ET", "SD", "NG", "KE", "MA", "TN", "DZ"]);
});

test("nationality labels use audience wording only", () => {
  const filipino = NATIONALITY_OPTIONS.find((option) => option.code === "PH");
  assert.ok(filipino);
  assert.equal(nationalityAudienceLabel(filipino!, "en"), "Filipino");
  assert.equal(nationalityAudienceLabel(filipino!, "ar"), "فلبيني");
});
