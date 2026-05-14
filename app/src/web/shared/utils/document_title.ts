const DOCUMENT_SITE_LABEL = "NDB2";

/** `<title>` string: `"Section · NDB2"`, or **`NDB2`** alone when no section name. */
export function documentTitle(sectionTitle?: string): string {
  const trimmed = sectionTitle?.trim();
  if (trimmed === undefined || trimmed === "") {
    return DOCUMENT_SITE_LABEL;
  }
  return `${trimmed} · ${DOCUMENT_SITE_LABEL}`;
}
