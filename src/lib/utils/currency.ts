/**
 * Converts a peso amount (e.g. 1500.5) into integer centavos (150050).
 */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/**
 * Formats integer centavos as Philippine Peso currency (e.g. "₱1,500.00").
 */
export function formatPhpFromCentavos(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}
