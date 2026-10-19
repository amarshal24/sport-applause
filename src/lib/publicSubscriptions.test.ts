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
});