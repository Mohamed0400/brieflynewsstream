import assert from "node:assert/strict";
import test from "node:test";
import {
  expatNationalityCodesForHost,
  isNationalityAllowedForHost,
  nationalityAudienceLabel,
  nationalityGroupsForHost,
  nationalityOptionsForHost,
  NATIONALITY_OPTIONS,
  sortNationalityOptionsByEditorialOrder,
} from "./nationalities";

test("host country scopes expat nationality options", () => {
  const allCodes = new Set(NATIONALITY_OPTIONS.map((option) => option.code));
  assert.deepEqual(
    new Set(nationalityOptionsForHost(undefined).map((option) => option.code)),
    allCodes,
  );
  assert.deepEqual(
    new Set(nationalityOptionsForHost(null).map((option) => option.code)),
    allCodes,
  );

  const saOptions = nationalityOptionsForHost("SA").map((option) => option.code);
  assert.ok(saOptions.includes("PH"));
  assert.ok(saOptions.includes("IN"));
  assert.ok(!saOptions.includes("SA"));

  const deOptions = nationalityOptionsForHost("DE").map((option) => option.code);
  assert.ok(deOptions.includes("TR"));
  assert.ok(!deOptions.includes("DE"));
});

test("community briefing order follows region browse buckets without Kuwaiti first", () => {
  const ordered = nationalityOptionsForHost(undefined).map((option) => option.code);
  assert.notEqual(ordered[0], "KW", "Kuwaiti should not lead the community picker");
  assert.equal(ordered[0], "EG", "Middle East browse order leads, without Gulf host nationals first");
  assert.ok(ordered.indexOf("EG") < ordered.indexOf("KW"), "Egypt precedes Kuwait within browse order");
  assert.ok(ordered.indexOf("EG") < ordered.indexOf("IN"), "Middle East precedes Asia-Pacific");

  const saOrdered = nationalityOptionsForHost("SA").map((option) => option.code);
  assert.notEqual(saOrdered[0], "IN", "scoped list should not open with a hardcoded expat priority");
  assert.equal(saOrdered[0], "EG", "Middle East precedes Asia-Pacific for host-scoped lists");
});

test("sortNationalityOptionsByEditorialOrder deprioritizes Gulf host nationals", () => {
  const sample = sortNationalityOptionsByEditorialOrder(
    NATIONALITY_OPTIONS.filter((option) => ["KW", "EG", "IN", "SA"].includes(option.code)),
  ).map((option) => option.code);
  assert.deepEqual(sample, ["EG", "KW", "SA", "IN"]);
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
