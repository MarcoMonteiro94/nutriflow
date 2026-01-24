/**
 * Anthropometry Calculations
 *
 * Utility functions for calculating body composition metrics
 * including BMI, body fat percentage (Jackson-Pollock 3-site protocol),
 * and waist-hip ratio.
 */

/**
 * Calculate Body Mass Index (BMI)
 * @param weight - Weight in kilograms
 * @param height - Height in centimeters
 * @returns BMI value or null if inputs are invalid
 */
export function calculateBMI(
  weight: number | null | undefined,
  height: number | null | undefined
): number | null {
  if (weight == null || height == null || weight <= 0 || height <= 0) {
    return null;
  }

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters ** 2);

  return Math.round(bmi * 100) / 100; // Round to 2 decimal places
}

/**
 * Get BMI classification in Portuguese
 * @param bmi - BMI value
 * @returns Classification string
 */
export function getBMIClassification(bmi: number | null | undefined): string {
  if (bmi == null) {
    return "N/A";
  }

  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade grau I";
  if (bmi < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

/**
 * Calculate Waist-Hip Ratio (WHR)
 * @param waistCircumference - Waist circumference in centimeters
 * @param hipCircumference - Hip circumference in centimeters
 * @returns WHR value or null if inputs are invalid
 */
export function calculateWaistHipRatio(
  waistCircumference: number | null | undefined,
  hipCircumference: number | null | undefined
): number | null {
  if (
    waistCircumference == null ||
    hipCircumference == null ||
    waistCircumference <= 0 ||
    hipCircumference <= 0
  ) {
    return null;
  }

  const whr = waistCircumference / hipCircumference;

  return Math.round(whr * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Get WHR classification in Portuguese
 * @param whr - WHR value
 * @param sex - "male" or "female"
 * @returns Classification string
 */
export function getWHRClassification(
  whr: number | null | undefined,
  sex: "male" | "female" | null | undefined
): string {
  if (whr == null || sex == null) {
    return "N/A";
  }

  if (sex === "male") {
    if (whr < 0.9) return "Baixo risco";
    if (whr < 1.0) return "Risco moderado";
    return "Alto risco";
  } else {
    if (whr < 0.8) return "Baixo risco";
    if (whr < 0.85) return "Risco moderado";
    return "Alto risco";
  }
}

/**
 * Calculate body fat percentage using Siri equation from body density
 * @param bodyDensity - Body density in g/cm³
 * @returns Body fat percentage or null if input is invalid
 */
function calculateBodyFatFromDensity(
  bodyDensity: number | null | undefined
): number | null {
  if (bodyDensity == null || bodyDensity <= 0) {
    return null;
  }

  const bodyFatPercentage = ((4.95 / bodyDensity) - 4.5) * 100;

  // Clamp to reasonable values (0-70%)
  const clampedValue = Math.max(0, Math.min(70, bodyFatPercentage));

  return Math.round(clampedValue * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate body fat percentage for males using Jackson-Pollock 3-site formula
 * Uses chest, abdomen, and thigh skinfold measurements
 *
 * @param chestSkinfold - Chest (pectoral) skinfold in mm
 * @param abdominalSkinfold - Abdominal skinfold in mm
 * @param thighSkinfold - Thigh skinfold in mm
 * @param age - Age in years
 * @returns Body fat percentage or null if inputs are invalid
 */
export function calculateBodyFatMale(
  chestSkinfold: number | null | undefined,
  abdominalSkinfold: number | null | undefined,
  thighSkinfold: number | null | undefined,
  age: number | null | undefined
): number | null {
  if (
    chestSkinfold == null ||
    abdominalSkinfold == null ||
    thighSkinfold == null ||
    age == null ||
    chestSkinfold <= 0 ||
    abdominalSkinfold <= 0 ||
    thighSkinfold <= 0 ||
    age <= 0
  ) {
    return null;
  }

  const sumSkinfolds = chestSkinfold + abdominalSkinfold + thighSkinfold;

  // Jackson-Pollock 3-site formula for males
  const bodyDensity =
    1.10938 -
    0.0008267 * sumSkinfolds +
    0.0000016 * sumSkinfolds ** 2 -
    0.0002574 * age;

  return calculateBodyFatFromDensity(bodyDensity);
}

/**
 * Calculate body fat percentage for females using Jackson-Pollock 3-site formula
 * Uses triceps, suprailiac, and thigh skinfold measurements
 *
 * @param tricepsSkinfold - Triceps skinfold in mm
 * @param suprailiacSkinfold - Suprailiac skinfold in mm
 * @param thighSkinfold - Thigh skinfold in mm
 * @param age - Age in years
 * @returns Body fat percentage or null if inputs are invalid
 */
export function calculateBodyFatFemale(
  tricepsSkinfold: number | null | undefined,
  suprailiacSkinfold: number | null | undefined,
  thighSkinfold: number | null | undefined,
  age: number | null | undefined
): number | null {
  if (
    tricepsSkinfold == null ||
    suprailiacSkinfold == null ||
    thighSkinfold == null ||
    age == null ||
    tricepsSkinfold <= 0 ||
    suprailiacSkinfold <= 0 ||
    thighSkinfold <= 0 ||
    age <= 0
  ) {
    return null;
  }

  const sumSkinfolds = tricepsSkinfold + suprailiacSkinfold + thighSkinfold;

  // Jackson-Pollock 3-site formula for females
  const bodyDensity =
    1.0994921 -
    0.0009929 * sumSkinfolds +
    0.0000023 * sumSkinfolds ** 2 -
    0.0001392 * age;

  return calculateBodyFatFromDensity(bodyDensity);
}

/**
 * Calculate body fat percentage based on sex
 * Convenience function that calls the appropriate formula based on sex
 *
 * @param sex - "male" or "female"
 * @param skinfolds - Object with required skinfold measurements
 * @param age - Age in years
 * @returns Body fat percentage or null if inputs are invalid
 */
export function calculateBodyFat(
  sex: "male" | "female" | null | undefined,
  skinfolds: {
    triceps?: number | null;
    suprailiac?: number | null;
    chest?: number | null;
    abdominal?: number | null;
    thigh?: number | null;
  },
  age: number | null | undefined
): number | null {
  if (sex == null || age == null) {
    return null;
  }

  if (sex === "male") {
    return calculateBodyFatMale(
      skinfolds.chest,
      skinfolds.abdominal,
      skinfolds.thigh,
      age
    );
  } else {
    return calculateBodyFatFemale(
      skinfolds.triceps,
      skinfolds.suprailiac,
      skinfolds.thigh,
      age
    );
  }
}

/**
 * Get body fat classification in Portuguese
 * Based on American Council on Exercise (ACE) categories
 *
 * @param bodyFat - Body fat percentage
 * @param sex - "male" or "female"
 * @returns Classification string
 */
export function getBodyFatClassification(
  bodyFat: number | null | undefined,
  sex: "male" | "female" | null | undefined
): string {
  if (bodyFat == null || sex == null) {
    return "N/A";
  }

  if (sex === "male") {
    if (bodyFat < 6) return "Gordura essencial";
    if (bodyFat < 14) return "Atlético";
    if (bodyFat < 18) return "Fitness";
    if (bodyFat < 25) return "Aceitável";
    return "Obesidade";
  } else {
    if (bodyFat < 14) return "Gordura essencial";
    if (bodyFat < 21) return "Atlético";
    if (bodyFat < 25) return "Fitness";
    if (bodyFat < 32) return "Aceitável";
    return "Obesidade";
  }
}

/**
 * Calculate sum of all provided skinfolds
 * @param skinfolds - Object with skinfold measurements (all optional)
 * @returns Sum of all non-null skinfold values or null if no values provided
 */
export function calculateSkinfoldSum(skinfolds: {
  triceps?: number | null;
  subscapular?: number | null;
  suprailiac?: number | null;
  abdominal?: number | null;
  thigh?: number | null;
  chest?: number | null;
  midaxillary?: number | null;
}): number | null {
  const values = Object.values(skinfolds).filter(
    (v): v is number => v != null && v > 0
  );

  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum * 100) / 100; // Round to 2 decimal places
}
