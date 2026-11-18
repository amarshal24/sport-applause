export function identitySports(selection: string, profileSports: readonly string[] | null | undefined): string[] {
  if (selection === "all") return [];
  const sports = selection === "mine" ? profileSports ?? [] : [selection];
  return [...new Set(sports.map(sport => sport.trim().toLowerCase()).filter(Boolean))];
}

export function matchesIdentitySport(memberSports: readonly string[] | null | undefined, selectedSports: readonly string[]): boolean {
  return selectedSports.length === 0 || (memberSports ?? []).some(sport => selectedSports.includes(sport.toLowerCase()));
}