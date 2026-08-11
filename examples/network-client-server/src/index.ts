import {
  ClientTransport,
  createItemServiceClient,
  runCrudDemo,
  benchmarkCreate,
} from "@grpc-demo/service";

/**
 * Client and server run in this one process, but they talk to each other
 * exactly the way they would if the server were on another machine: the
 * server binds a socket, the client dials it, and every call goes through
 * real proto serialization over that socket.
 *
 * createItemServiceClient(ClientTransport.NETWORK) is the only thing this
 * file needs to know about -- it hides exactly how the server and client
 * are wired up, and gives back a shutdown() hook that releases everything
 * (server + socket) regardless of transport.
 */
async function main() {
  const { client, address, shutdown } = await createItemServiceClient(ClientTransport.NETWORK);
  console.log(`gRPC server listening on ${address}`);

  try {
    await runCrudDemo(client, "network client -> gRPC server (TCP loopback socket)");

    const avgMs = await benchmarkCreate(client, 200);
    console.log(`\naverage createItem latency over network client: ${avgMs.toFixed(3)}ms`);
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
