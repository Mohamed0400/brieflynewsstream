import assert from "node:assert/strict";
import test from "node:test";
import { groupCountryCodesByRegion } from "./supported-countries";

test("Middle East country picker uses editorial order, not alphabetical", () => {
  const groups = groupCountryCodesByRegion(
    ["IL", "KW", "SA", "AE", "EG", "JO", "TR"],
    "ar",
  );
  const middleEast = groups.find((group) => group.key === "middle_east");
  assert.ok(middleEast);
  assert.equal(middleEast.items[0]?.code, "SA");
  assert.equal(middleEast.items.at(-1)?.code, "IL");
});
