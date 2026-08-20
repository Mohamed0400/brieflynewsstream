import assert from "node:assert/strict";
import { describe, test } from "node:test";

describe("cloudinary helpers", () => {
  test("parses CLOUDINARY_URL and builds optimized fetch URL", async () => {
    process.env.CLOUDINARY_URL =
      process.env.CLOUDINARY_URL ||
      "cloudinary://648469965841431:0h2vlEkwR6oQM-SwdL1mEFLcTYs@dwrltwsn3";
    // Clear discrete overrides so URL parsing is exercised
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const {
      cloudinaryConfig,
      isCloudinaryConfigured,
      isCloudinaryHosted,
      optimizedFetchUrl,
      publicIdFromCloudinaryUrl,
    } = await import("./cloudinary");

    const cfg = cloudinaryConfig();
    assert.equal(cfg.cloudName, "dwrltwsn3");
    assert.equal(cfg.apiKey, "648469965841431");
    assert.ok(isCloudinaryConfigured());

    const fetchUrl = optimizedFetchUrl("https://example.com/photo.jpg", {
      width: 800,
    });
    assert.ok(fetchUrl);
    assert.match(fetchUrl!, /res\.cloudinary\.com\/dwrltwsn3\/image\/fetch/);
    assert.match(fetchUrl!, /f_auto/);
    assert.match(fetchUrl!, /q_auto/);

    assert.equal(isCloudinaryHosted("https://res.cloudinary.com/dwrltwsn3/image/upload/v1/x.png"), true);
    assert.equal(isCloudinaryHosted("https://cdn.example.com/x.png"), false);

    const publicId = publicIdFromCloudinaryUrl(
      "https://res.cloudinary.com/dwrltwsn3/image/upload/v1710000000/briefly-newsstream/smoke/pixel.png",
    );
    assert.equal(publicId, "briefly-newsstream/smoke/pixel");
  });
});
