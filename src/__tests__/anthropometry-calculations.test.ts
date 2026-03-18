import { describe, it, expect } from "vitest";
import {
  calculateBMI,
  getBMIClassification,
  calculateWaistHipRatio,
  getWHRClassification,
  calculateSkinfoldSum,
} from "@/lib/anthropometry-calculations";

describe("calculateBMI", () => {
  it("calculates BMI correctly for normal values", () => {
    // 75kg, 175cm → BMI = 75 / (1.75²) = 24.49
    expect(calculateBMI(75, 175)).toBeCloseTo(24.49, 1);
  });

  it("calculates BMI for obese values", () => {
    // 100kg, 170cm → BMI = 100 / (1.7²) = 34.60
    expect(calculateBMI(100, 170)).toBeCloseTo(34.6, 1);
  });

  it("returns null for null weight", () => {
    expect(calculateBMI(null, 175)).toBeNull();
  });

  it("returns null for null height", () => {
    expect(calculateBMI(75, null)).toBeNull();
  });

  it("returns null for zero weight", () => {
    expect(calculateBMI(0, 175)).toBeNull();
  });

  it("returns null for negative height", () => {
    expect(calculateBMI(75, -10)).toBeNull();
  });

  it("returns null for undefined inputs", () => {
    expect(calculateBMI(undefined, undefined)).toBeNull();
  });
});

describe("getBMIClassification", () => {
  it("classifies underweight", () => {
    expect(getBMIClassification(17.5)).toBe("Abaixo do peso");
  });

  it("classifies normal weight", () => {
    expect(getBMIClassification(22.0)).toBe("Peso normal");
  });

  it("classifies overweight", () => {
    expect(getBMIClassification(27.0)).toBe("Sobrepeso");
  });

  it("classifies obesity grade 1", () => {
    expect(getBMIClassification(32.0)).toBe("Obesidade grau I");
  });

  it("classifies obesity grade 2", () => {
    expect(getBMIClassification(37.0)).toBe("Obesidade grau II");
  });

  it("classifies obesity grade 3", () => {
    expect(getBMIClassification(42.0)).toBe("Obesidade grau III");
  });

  it("returns N/A for null", () => {
    expect(getBMIClassification(null)).toBe("N/A");
  });
});

describe("calculateWaistHipRatio", () => {
  it("calculates WHR correctly", () => {
    expect(calculateWaistHipRatio(80, 95)).toBeCloseTo(0.842, 2);
  });

  it("returns null for null waist", () => {
    expect(calculateWaistHipRatio(null, 95)).toBeNull();
  });

  it("returns null for zero hip", () => {
    expect(calculateWaistHipRatio(80, 0)).toBeNull();
  });
});

describe("getWHRClassification", () => {
  it("classifies low risk for male", () => {
    expect(getWHRClassification(0.85, "male")).toBe("Baixo risco");
  });

  it("classifies moderate risk for male", () => {
    expect(getWHRClassification(0.95, "male")).toBe("Risco moderado");
  });

  it("classifies high risk for male", () => {
    expect(getWHRClassification(1.05, "male")).toBe("Alto risco");
  });

  it("classifies low risk for female", () => {
    expect(getWHRClassification(0.75, "female")).toBe("Baixo risco");
  });

  it("classifies high risk for female", () => {
    expect(getWHRClassification(0.9, "female")).toBe("Alto risco");
  });

  it("returns N/A when sex is null", () => {
    expect(getWHRClassification(0.85, null)).toBe("N/A");
  });
});

describe("calculateSkinfoldSum", () => {
  it("sums all non-null skinfolds", () => {
    expect(
      calculateSkinfoldSum({
        triceps: 15,
        suprailiac: 20,
        chest: 10,
        abdominal: null,
        thigh: 25,
        subscapular: null,
        midaxillary: null,
      })
    ).toBe(70);
  });

  it("returns null when all skinfolds are null", () => {
    expect(
      calculateSkinfoldSum({
        triceps: null,
        suprailiac: null,
        chest: null,
        abdominal: null,
        thigh: null,
        subscapular: null,
        midaxillary: null,
      })
    ).toBeNull();
  });
});
