import assert from "node:assert/strict";
import test from "node:test";
import { clearToasts, getServerToasts, getToasts, toast } from "./toast";

test("toast store records errors, alerts, and exceptions", () => {
  clearToasts();
  toast.error("The request failed.");
  toast.success("Schedule saved.");
  toast.warning("The job was skipped.");
  toast.exception(new Error("Database unavailable"));

  const items = getToasts();
  assert.equal(items.length, 4);
  assert.equal(items[0].kind, "error");
  assert.equal(items[0].message, "Database unavailable");
  assert.equal(items[1].kind, "warning");
  assert.equal(items[2].kind, "success");
  assert.equal(items[3].message, "The request failed.");
  clearToasts();
  assert.equal(getToasts().length, 0);
});

test("server toast snapshot is a cached empty array", () => {
  assert.equal(getServerToasts(), getServerToasts());
  assert.deepEqual(getServerToasts(), []);
});

test("duplicate toasts refresh instead of stacking", () => {
  clearToasts();
  toast.error("Same message");
  toast.error("Same message");
  assert.equal(getToasts().length, 1);
  clearToasts();
});
