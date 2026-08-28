import assert from "node:assert/strict";
import test from "node:test";
import { formatPublishedAge, publishedAgeParts } from "./published-age";

const now = new Date("2026-08-28T13:00:00.000Z");

test("publishedAgeParts returns minute-level age", () => {
  const parts = publishedAgeParts(new Date("2026-08-28T12:45:00.000Z"), now);
  assert.equal(parts.totalMinutes, 15);
  assert.equal(parts.hours, 0);
  assert.equal(parts.minutes, 15);
  assert.equal(parts.ageSeconds, 900);
});

test("formatPublishedAge shows minutes for recent stories", () => {
  assert.equal(
    formatPublishedAge(new Date("2026-08-28T12:45:00.000Z"), "en", now),
    "15m ago",
  );
});

test("formatPublishedAge shows hours and minutes within the same day", () => {
  assert.equal(
    formatPublishedAge(new Date("2026-08-28T11:30:00.000Z"), "en", now),
    "1h 30m ago",
  );
  assert.equal(
    formatPublishedAge(new Date("2026-08-28T05:00:00.000Z"), "ar", now),
    "منذ 8 س",
  );
});

test("formatPublishedAge shows just now under one minute", () => {
  assert.equal(
    formatPublishedAge(new Date("2026-08-28T12:59:30.000Z"), "en", now),
    "just now",
  );
});
