import { Region } from "@prisma/client";
import { allLiveCountrySources, allSeedSources } from "../src/lib/country-sources";

const MENA_COUNTRIES = new Set([
  "KW", "SA", "AE", "QA", "BH", "OM", "EG", "JO", "IQ", "LB", "SY", "YE",
  "PS", "SD", "LY", "IR", "TR", "MA", "TN", "DZ", "IL",
]);

function duplicates(values: string[]) {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return dupes;
}

const live = allLiveCountrySources();
const seed = allSeedSources();
const liveCodes = live.map((source) => source.code);
const liveUrls = live.map((source) => source.url);
const seedCodeDupes = duplicates(seed.codes);
const seedUrlDupes = duplicates(seed.urls);
const menaLive = live.filter((source) =>
  source.region === Region.MIDDLE_EAST || MENA_COUNTRIES.has(source.country),
);

console.log(JSON.stringify({
  liveSources: live.length,
  liveUniqueCodes: new Set(liveCodes).size,
  liveUniqueUrls: new Set(liveUrls).size,
  seedUniqueCodes: new Set(seed.codes).size,
  seedUniqueUrls: new Set(seed.urls).size,
  seedCodeRows: seed.codes.length,
  seedUrlRows: seed.urls.length,
  duplicateSeedCodes: seedCodeDupes.size,
  duplicateSeedUrls: seedUrlDupes.size,
  splitEstimate: {
    menaLive: menaLive.length,
    globalAndOtherLive: live.length - menaLive.length,
  },
}, null, 2));
