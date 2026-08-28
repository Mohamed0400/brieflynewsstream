import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMaintenanceStatus,
  formatMaintenanceCountdown,
} from "./maintenance";
import { DEFAULT_OPS_SETTINGS } from "./ops-settings";

test("maintenance countdown is computed before scheduled start", () => {
  const now = new Date("2026-07-08T12:00:00.000Z");
  const status = buildMaintenanceStatus({
    ...DEFAULT_OPS_SETTINGS,
    apiMaintenanceNotice: "Maintenance is scheduled for Jul 8 at 2:00 PM UTC.",
    apiMaintenanceScheduledAt: "2026-07-08T14:00:00.000Z",
  }, now);
  assert.equal(status.apiActive, false);
  assert.equal(status.notice, "Maintenance is scheduled for Jul 8 at 2:00 PM UTC.");
  assert.equal(status.countdownSeconds, 7200);
});

test("active maintenance exposes a professional API message", () => {
  const status = buildMaintenanceStatus({
    ...DEFAULT_OPS_SETTINGS,
    apiMaintenanceActive: true,
    apiMaintenanceMessage: "We are upgrading API infrastructure. Retry in one hour.",
  });
  assert.equal(status.apiActive, true);
  assert.match(status.apiMessage, /upgrading API infrastructure/);
});

test("maintenance countdown formatting is human readable", () => {
  assert.equal(formatMaintenanceCountdown(7265), "2h 1m 5s");
  assert.equal(formatMaintenanceCountdown(59), "59s");
});
