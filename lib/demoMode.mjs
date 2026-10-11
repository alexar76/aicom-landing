/** Floor / marketing demo — instant example landing without LLM keys. */
export function isDemoMode() {
  const raw = process.env.AICOM_LANDING_DEMO_MODE;
  return raw === "1" || raw === "true";
}
