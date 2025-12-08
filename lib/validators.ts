import { cleanText } from "./sanitizers";

export function validateRequired(field: any, fieldName: string) {
  if (cleanText(field).length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}

export function validateSmartStructure(smart: any) {
  const fields = ["specific", "measurable", "achievable", "relevant", "timeBased"];
  for (const f of fields) {
    if (!smart?.[f] || cleanText(smart[f]).length === 0) {
      throw new Error(`SMART field '${f}' missing`);
    }
  }
}
