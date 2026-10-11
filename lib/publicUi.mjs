/** True when serving the public hosted UI (not a personal localhost dev session). */
export function isPublicUi() {
  const raw = process.env.AICOM_LANDING_PUBLIC_UI;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  // Path-based deploy on a real domain is treated as public unless overridden.
  const base = (process.env.AICOM_LANDING_BASE_PATH || "").trim();
  return base.length > 0;
}
