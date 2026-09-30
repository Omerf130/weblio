export function getGooglePlacesApiKey(
  source: Record<string, string | undefined> = process.env
): string | null {
  const key = source.GOOGLE_PLACES_API_KEY?.trim();
  return key ? key : null;
}
