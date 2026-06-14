/** True when at least one cloud LLM API key is configured (not Ollama-only). */
export function isLlmConfigured() {
  for (const name of ["ANTHROPIC_API_KEY", "DEEPSEEK_API_KEY", "OPENAI_API_KEY"]) {
    const v = process.env[name];
    if (typeof v === "string" && v.trim()) return true;
  }
  return false;
}
