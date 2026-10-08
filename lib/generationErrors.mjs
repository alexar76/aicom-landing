/** Errors safe to return in API/UI (no provider internals). */
export class UserFacingGenerationError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "UserFacingGenerationError";
  }
}

export class ModelOutputError extends UserFacingGenerationError {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "ModelOutputError";
  }
}

export class LlmConnectionError extends UserFacingGenerationError {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "LlmConnectionError";
  }
}
