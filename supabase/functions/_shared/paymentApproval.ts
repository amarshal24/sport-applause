export function isPublicCheckoutAllowed(environment: "sandbox" | "live", approval: string | undefined) {
  return environment === "sandbox" || approval === "true";
}