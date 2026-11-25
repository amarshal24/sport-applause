import { test } from "node:test";
import assert from "node:assert/strict";
import { subscriptionSchema } from "./publicSubscriptions";
test("public subscriptions accept multiple sports and other interests without an account", () => {
  const r = subscriptionSchema.parse({email:"Test@example.com",interests:["soccer","basketball","media","coaching","fitness","creators"],newsletter:true,events:false});
  assert.equal(r.interests.length,6); assert.equal(r.email,"test@example.com");
});
test("newsletter and events consent remain independent and require an explicit choice", () => {
  for (const [newsletter,events] of [[true,false],[false,true],[true,true]]) {
    const r=subscriptionSchema.parse({email:"test@example.com",interests:["fitness"],newsletter,events});
    assert.equal(r.newsletter,newsletter); assert.equal(r.events,events);
  }
  assert.equal(subscriptionSchema.safeParse({email:"test@example.com",interests:["fitness"],newsletter:false,events:false}).success,false);
});
test("invalid interests and missing interests are rejected",()=>{
  for(const interests of [[],["not-a-sport"]]) assert.equal(subscriptionSchema.safeParse({email:"test@example.com",interests,newsletter:true,events:false}).success,false);
});import { interests } from "./publicSubscriptions";
import { readFileSync } from "node:fs";
test("gaming and recruiting are available interest categories", () => {
  for (const interest of ["gaming", "recruiting"]) {
    assert.equal(subscriptionSchema.safeParse({ email: "test@example.com", interests: [interest], newsletter: true, events: false }).success, true);
  }
});
test("every required newsletter category is offered", () => {
  const required = ["media", "podcasts", "coaching", "fitness", "gaming", "recruiting", "creators"];
  for (const category of required) assert.ok((interests as readonly string[]).includes(category), `missing ${category}`);
  assert.ok(interests.some((i) => ["basketball", "football", "soccer"].includes(i)), "sports are offered");
});
test("the interest list has no duplicates and the whole list round-trips through the schema", () => {
  assert.equal(new Set(interests).size, interests.length);
  const r = subscriptionSchema.parse({ email: "all@example.com", interests: [...interests], newsletter: true, events: true });
  assert.equal(r.interests.length, interests.length);
});
test("the edge function and the form share one topic list (no hard-coded copy to drift)", () => {
  const edge = readFileSync(new URL("../../supabase/functions/public-subscriptions/index.ts", import.meta.url), "utf8");
  assert.match(edge, /from "\.\.\/_shared\/subscriptionTopics\.ts"/);
  assert.doesNotMatch(edge, /const topics\s*=\s*\[/);
});
