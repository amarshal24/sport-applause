import { defineMcp } from "@lovable.dev/mcp-js";
import listTrendingPosts from "./tools/list-trending-posts";
import searchAthletes from "./tools/search-athletes";
import getMotivationQuote from "./tools/get-motivation-quote";

export default defineMcp({
  name: "usportz-mcp",
  title: "U⚡️Sportz MCP",
  version: "0.1.0",
  instructions:
    "Tools for U⚡️Sportz — browse trending sports highlights, search athlete profiles, and get AI-generated motivation for athletes.",
  tools: [listTrendingPosts, searchAthletes, getMotivationQuote],
});
