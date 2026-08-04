import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTrendingPosts from "./tools/list-trending-posts";
import searchAthletes from "./tools/search-athletes";
import getMotivationQuote from "./tools/get-motivation-quote";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "usportz-mcp",
  title: "U⚡️Sportz MCP",
  version: "0.1.0",
  instructions:
    "Tools for U⚡️Sportz — browse trending sports highlights, search athlete profiles, and get AI-generated motivation for athletes. Callers act as the signed-in U⚡️Sportz user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTrendingPosts, searchAthletes, getMotivationQuote],
});
