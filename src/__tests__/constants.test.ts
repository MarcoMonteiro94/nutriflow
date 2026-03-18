import { describe, it, expect } from "vitest";
import { APPOINTMENT_TRANSITIONS } from "@/lib/constants";

describe("APPOINTMENT_TRANSITIONS", () => {
  it("allows scheduled → cancelled", () => {
    expect(APPOINTMENT_TRANSITIONS.scheduled).toContain("cancelled");
  });

  it("allows scheduled → completed", () => {
    expect(APPOINTMENT_TRANSITIONS.scheduled).toContain("completed");
  });

  it("allows scheduled → no_show", () => {
    expect(APPOINTMENT_TRANSITIONS.scheduled).toContain("no_show");
  });

  it("disallows completed → anything", () => {
    expect(APPOINTMENT_TRANSITIONS.completed).toHaveLength(0);
  });

  it("disallows cancelled → anything", () => {
    expect(APPOINTMENT_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it("disallows no_show → anything", () => {
    expect(APPOINTMENT_TRANSITIONS.no_show).toHaveLength(0);
  });
});
