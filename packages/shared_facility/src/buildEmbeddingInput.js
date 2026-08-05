export function buildEmbeddingInput({ bio, interests }) {
    const interestsText = (interests ?? []).join(', ');
    return `Bio: ${bio ?? ''}\nInterests: ${interestsText}`.trim();
  }
  