type CitationValidation = {
  referencedLabels: string[];
  validLabels: string[];
  invalidLabels: string[];
  status: "CITED" | "MISSING" | "INVALID";
};

const CITATION_PATTERN = /\[(S\d+)\]/g;

/** Validate model citation markers against the chunks actually retrieved. */
export function validateCitationLabels(
  text: string,
  allowedLabels: string[],
): CitationValidation {
  const referencedLabels = [...text.matchAll(CITATION_PATTERN)]
    .map((match) => match[1])
    .filter((label, index, labels) => labels.indexOf(label) === index);
  const allowed = new Set(allowedLabels);
  const validLabels = referencedLabels.filter((label) => allowed.has(label));
  const invalidLabels = referencedLabels.filter((label) => !allowed.has(label));
  return {
    referencedLabels,
    validLabels,
    invalidLabels,
    status: validLabels.length > 0
      ? (invalidLabels.length > 0 ? "INVALID" : "CITED")
      : (referencedLabels.length > 0 ? "INVALID" : "MISSING"),
  };
}

/** Remove citation markers that do not correspond to retrieved source chunks. */
export function removeInvalidCitationLabels(text: string, allowedLabels: string[]) {
  const allowed = new Set(allowedLabels);
  return text.replace(CITATION_PATTERN, (full, label: string) =>
    allowed.has(label) ? full : "(source not verified)"
  );
}
