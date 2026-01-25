import type { Measurement, CustomMeasurementType, CustomMeasurementValue } from "@/types/database";

interface CustomMeasurementWithType extends CustomMeasurementValue {
  custom_measurement_types?: CustomMeasurementType;
}

interface MeasurementWithCustom extends Measurement {
  custom_measurement_values?: CustomMeasurementWithType[];
}

export function generateMeasurementCSV(measurements: MeasurementWithCustom[]): string {
  if (measurements.length === 0) {
    return "Date,Weight,Height,Body Fat %,Muscle Mass,Waist,Hip\n";
  }

  // Collect all unique custom measurement types across all measurements
  const customTypes = new Map<string, string>();

  measurements.forEach((measurement) => {
    measurement.custom_measurement_values?.forEach((customValue) => {
      if (customValue.custom_measurement_types) {
        const typeId = customValue.type_id;
        const typeName = customValue.custom_measurement_types.name;
        const typeUnit = customValue.custom_measurement_types.unit;
        customTypes.set(typeId, `${typeName} (${typeUnit})`);
      }
    });
  });

  // Build header row
  const standardHeaders = ["Date", "Weight", "Height", "Body Fat %", "Muscle Mass", "Waist", "Hip"];
  const customHeaders = Array.from(customTypes.values());
  const headers = [...standardHeaders, ...customHeaders];

  // Build data rows
  const rows = measurements.map((measurement) => {
    const date = new Date(measurement.measured_at).toLocaleDateString("pt-BR");
    const weight = measurement.weight?.toString() ?? "";
    const height = measurement.height?.toString() ?? "";
    const bodyFat = measurement.body_fat_percentage?.toString() ?? "";
    const muscleMass = measurement.muscle_mass?.toString() ?? "";
    const waist = measurement.waist_circumference?.toString() ?? "";
    const hip = measurement.hip_circumference?.toString() ?? "";

    const standardValues = [date, weight, height, bodyFat, muscleMass, waist, hip];

    // Add custom measurement values in the same order as headers
    const customValues = Array.from(customTypes.keys()).map((typeId) => {
      const customValue = measurement.custom_measurement_values?.find(
        (cv) => cv.type_id === typeId
      );
      return customValue?.value?.toString() ?? "";
    });

    return [...standardValues, ...customValues];
  });

  // Combine headers and rows into CSV format
  const csvLines = [headers.join(",")];

  rows.forEach((row) => {
    // Escape values that contain commas, quotes, or newlines
    const escapedRow = row.map((value) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(escapedRow.join(","));
  });

  return csvLines.join("\n");
}
