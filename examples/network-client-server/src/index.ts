import {
  InMemoryItemService,
  startGrpcServer,
  createNetworkClient,
  runCrudDemo,
  benchmarkCreate,
} from "@grpc-demo/service";

/**
 * Client and server run in this one process, but they talk to each other
 * exactly the way they would if the server were on another machine: the
 * server binds a socket, the client dials it, and every call goes through
 * real proto serialization over that socket.
 *
 * When the ItemService is ready to move out of this process, nothing here
 * changes except the address passed to createNetworkClient.
 */
async function main() {
  const impl = new InMemoryItemService();
  const { server, address } = await startGrpcServer(impl, "127.0.0.1:0");
  console.log(`gRPC server listening on ${address}`);

  const client = createNetworkClient(address);

  await runCrudDemo(client, "network client -> gRPC server (loopback socket)");

  const avgMs = await benchmarkCreate(client, 1000);
  console.log(`\naverage createItem latency over network client: ${avgMs.toFixed(3)}ms`);

  client.close();
  server.forceShutdown();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
