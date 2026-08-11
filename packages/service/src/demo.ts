import { ItemServiceApi } from "./types";

/**
 * The same CRUD call sequence, run against whatever ItemServiceApi is
 * handed in. Both example apps call this unchanged -- the only difference
 * between them is how the client was constructed (network vs. local).
 */
export async function runCrudDemo(client: ItemServiceApi, label: string): Promise<void> {
  console.log(`\n--- ${label} ---`);

  const created = await client.createItem({ name: "widget", payload: "v1" });
  console.log("created:", created);

  const fetched = await client.getItem({ id: created.id });
  console.log("fetched:", fetched);

  const updated = await client.updateItem({ id: created.id, name: "widget", payload: "v2" });
  console.log("updated:", updated);

  // pageSize: 0 and pageToken: "" are proto3's zero values -- the generated
  // request type has no optional fields, so "give me everything from the
  // start" is spelled out explicitly rather than omitted.
  const listed = await client.listItems({ pageSize: 0, pageToken: "" });
  console.log("listed:", listed.items.length, "item(s)");

  await client.deleteItem({ id: created.id });
  console.log("deleted:", created.id);

  try {
    await client.getItem({ id: created.id });
  } catch (err) {
    console.log("get-after-delete correctly failed:", (err as Error).message);
  }
}

/**
 * Runs `iterations` createItem calls back-to-back and reports the average
 * latency, so the two example apps can print a like-for-like comparison of
 * network-serialized vs. in-process calls.
 */
export async function benchmarkCreate(
  client: ItemServiceApi,
  iterations: number
): Promise<number> {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    await client.createItem({ name: `item-${i}`, payload: "benchmark" });
  }
  const end = process.hrtime.bigint();
  const totalMs = Number(end - start) / 1_000_000;
  return totalMs / iterations;
}
