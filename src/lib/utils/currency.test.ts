import { describe, expect, it } from "vitest";
import { formatPhpFromCentavos, pesosToCentavos } from "./currency";

describe("currency utilities", () => {
  it("converts pesos to integer centavos without floating point drift", () => {
    expect(pesosToCentavos(1500)).toBe(150000);
    expect(pesosToCentavos(19.99)).toBe(1999);
    expect(pesosToCentavos(2500.5)).toBe(250050);
  });

  it("formats centavos as PHP currency", () => {
    expect(formatPhpFromCentavos(150000)).toBe("₱1,500.00");
    expect(formatPhpFromCentavos(5000)).toBe("₱50.00");
  });
});
