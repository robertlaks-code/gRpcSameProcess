import fs from "fs";
import os from "os";
import path from "path";
import {
  InMemoryItemService,
  startGrpcServer,
  createNetworkClient,
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
 * box. Swapping back to a TCP address (or a real remote host:port) is a
 * one-line change to `address` -- everything else here is identical to the
 * TCP example.
 */
async function main() {
  const socketPath = path.join(os.tmpdir(), `grpc-crud-demo-${process.pid}.sock`);
  const address = `unix://${socketPath}`;

  const impl = new InMemoryItemService();
  const { server } = await startGrpcServer(impl, address);
  console.log(`gRPC server listening on ${address}`);

  const client = createNetworkClient(address);

  try {
    await runCrudDemo(client, "network client -> gRPC server (unix domain socket)");

    const avgMs = await benchmarkCreate(client, 200);
    console.log(`\naverage createItem latency over unix socket client: ${avgMs.toFixed(3)}ms`);
  } finally {
    client.close();
    server.forceShutdown();
    fs.unlink(socketPath, () => {
      /* best-effort cleanup of the socket file in tmp */
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
