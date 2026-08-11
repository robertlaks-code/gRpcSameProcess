import {
  ClientTransport,
  createItemServiceClient,
  runCrudDemo,
  benchmarkCreate,
} from "@grpc-demo/service";

/**
 * The same real gRPC client/server pattern as examples/network-client-server,
 * but bound to a Unix domain socket instead of a TCP loopback address.
 *
 * A UDS is still a real socket with full proto serialization -- unlike the
 * in-process fast client, it's not free -- but for same-host IPC it skips
 * the TCP/IP stack, so it typically lands between the TCP loopback client
 * and the in-process client on latency. It's also a common real-world
 * choice for sidecars and same-host services that never need to leave the
 * box.
 *
 * Swapping transports is the one-word change from ClientTransport.NETWORK
 * to ClientTransport.UNIX_DOMAIN_SOCKETS below -- createItemServiceClient
 * handles standing up the right server, picking its address, and tearing
 * it all down (including the socket file) on shutdown().
 */
async function main() {
  const { client, address, shutdown } = await createItemServiceClient(
    ClientTransport.UNIX_DOMAIN_SOCKETS
  );
  console.log(`gRPC server listening on ${address}`);

  try {
    await runCrudDemo(client, "network client -> gRPC server (unix domain socket)");

    const avgMs = await benchmarkCreate(client, 200);
    console.log(`\naverage createItem latency over unix socket client: ${avgMs.toFixed(3)}ms`);
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
