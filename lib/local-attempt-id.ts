type RandomUuidSource = {
  randomUUID?: () => string;
};

export function createLocalAttemptId(
  cryptoSource: RandomUuidSource | undefined = globalThis.crypto,
  now = Date.now(),
  random = Math.random(),
) {
  if (typeof cryptoSource?.randomUUID === "function") {
    return cryptoSource.randomUUID();
  }

  return `free-${now.toString(36)}-${random.toString(36).slice(2, 12)}`;
}
