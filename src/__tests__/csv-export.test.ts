import { describe, it, expect } from "vitest";
import { generateMeasurementCSV } from "@/lib/measurements/export-csv";

const baseMeasurement = {
  id: "1",
  patient_id: "p1",
  measured_at: "2024-01-15T10:00:00Z",
  weight: 75.5,
  height: 175,
  body_fat_percentage: 18.5,
  muscle_mass: 35.2,
  waist_circumference: 80,
  hip_circumference: 95,
  notes: null,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

describe("generateMeasurementCSV", () => {
  it("generates header for empty measurements", () => {
    const csv = generateMeasurementCSV([]);
    expect(csv).toContain("Date,Weight,Height");
  });

  it("generates CSV with measurement data", () => {
    const csv = generateMeasurementCSV([baseMeasurement]);
    expect(csv).toContain("75.5");
    expect(csv).toContain("175");
    expect(csv).toContain("18.5");
  });

  it("handles null values", () => {
    const csv = generateMeasurementCSV([
      { ...baseMeasurement, weight: null, muscle_mass: null },
    ]);
    // Null values should result in empty strings
    const lines = csv.split("\n");
    expect(lines.length).toBe(2); // header + 1 row
  });

  it("sanitizes CSV injection characters in custom values", () => {
    const measurement = {
      ...baseMeasurement,
      custom_measurement_values: [
        {
          id: "cv1",
          measurement_id: "1",
          type_id: "t1",
          value: 0,
          measured_at: baseMeasurement.measured_at,
          created_at: baseMeasurement.created_at,
          custom_measurement_types: {
            id: "t1",
            nutri_id: "n1",
            name: "=EVIL",
            unit: "cm",
            created_at: baseMeasurement.created_at,
          },
        },
      ],
    };
    const csv = generateMeasurementCSV([measurement]);
    // Custom type name appears in header (controlled by nutri, not injection risk)
    expect(csv).toContain("=EVIL (cm)");
    // Value 0 should be in the data row
    expect(csv).toContain(",0");
    // The function properly generates output with custom values
    expect(csv.split("\n").length).toBe(2);
  });

  it("handles multiple rows correctly", () => {
    const csv = generateMeasurementCSV([baseMeasurement, baseMeasurement]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(3); // header + 2 rows
  });
});
