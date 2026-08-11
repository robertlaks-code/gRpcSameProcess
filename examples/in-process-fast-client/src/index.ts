import {
  InMemoryItemService,
  createLocalClient,
  runCrudDemo,
  benchmarkCreate,
} from "@grpc-demo/service";

/**
 * Client and server are still conceptually separate here -- the app talks
 * to an ItemServiceApi, never to InMemoryItemService directly -- but
 * createLocalClient calls straight into the implementation instead of
 * going through proto encode/decode and a socket. Same call sites as the
 * network example, no serialization cost.
 */
async function main() {
  const impl = new InMemoryItemService();
  const client = createLocalClient(impl);

  await runCrudDemo(client, "local client -> in-process handlers (no serialization)");

  const avgMs = await benchmarkCreate(client, 200);
  console.log(`\naverage createItem latency over local client: ${avgMs.toFixed(3)}ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
