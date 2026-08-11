import {
  ClientTransport,
  createItemServiceClient,
  runCrudDemo,
  benchmarkCreate,
} from "@grpc-demo/service";

/**
 * Client and server are still conceptually separate here -- the app talks
 * to an ItemServiceApi, never to InMemoryItemService directly -- but
 * ClientTransport.LOCAL calls straight into the implementation instead of
 * going through proto encode/decode and a socket. Same call sites as the
 * network and unix-socket examples, no serialization cost.
 *
 * shutdown() is a no-op for this transport (no server, no socket to
 * release) but it's still safe -- and expected -- to call, since callers
 * shouldn't need to know which transport they got.
 */
async function main() {
  const { client, shutdown } = await createItemServiceClient(ClientTransport.LOCAL);

  try {
    await runCrudDemo(client, "local client -> in-process handlers (no serialization)");

    const avgMs = await benchmarkCreate(client, 200);
    console.log(`\naverage createItem latency over local client: ${avgMs.toFixed(3)}ms`);
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
