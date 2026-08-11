# gRPC CRUD service: same-process today, network-ready tomorrow

A yarn-workspaces monorepo demonstrating four ways to talk to the same
CRUD service, so the service can move out-of-process later without any
call-site changes.

## Layout

- `packages/service/proto/crud.proto` — the service contract (an `ItemService`
  with Create/Get/Update/Delete/List RPCs). This is the one thing that
  doesn't change when the service moves across a network.
- `packages/service/src/generated/` — TypeScript message types and a typed
  client/handler contract, generated straight from `crud.proto` by
  `proto-loader-gen-types` on every `yarn build` (not checked in, so it can
  never drift from the `.proto`). Run `yarn workspace @grpc-demo/service
  generate` to regenerate on demand.
- `packages/service/src/handlers.ts` — `InMemoryItemService`, the actual
  business logic. Transport-agnostic; equivalent to today's "library
  package" that apps instantiate directly.
- `packages/service/src/types.ts` — `ItemServiceApi`, the one hand-written
  interface in this package. It's a thin Promise-based re-statement of the
  generated message types, and every transport implements it. Application
  code should depend on this interface, not on any specific transport, or
  on the generated (callback-based) client type directly.
- `packages/service/src/grpc/server.ts` — wraps an `ItemServiceApi` impl as
  a real `@grpc/grpc-js` server, typed against the generated
  `ItemServiceHandlers` contract so a renamed or changed rpc fails to
  compile here instead of failing at runtime.
- `packages/service/src/grpc/networkClient.ts` — a real gRPC client
  (`createNetworkClient(address)`), built on the generated
  `ItemServiceClient`. Proto-encodes requests, sends them over a socket,
  proto-decodes responses. This is what a client in a different process, or
  on a different machine, would use.
- `packages/service/src/grpc/localClient.ts` — an in-process client
  (`createLocalClient(impl)`) that implements the same `ItemServiceApi`
  interface but calls straight into the implementation — no proto
  encode/decode, no socket.
- `packages/service/src/clientFactory.ts` — `createItemServiceClient(transport)`,
  a small dependency-injection style factory. Pass a `ClientTransport`
  (`LOCAL`, `NETWORK`, or `UNIX_DOMAIN_SOCKETS`) and get back `{ client,
  address?, shutdown() }`. This is the one place that knows how to stand up
  each transport's server (if any) and pick its address; `shutdown()`
  closes the client and releases whatever the client doesn't release on its
  own (the gRPC server, its socket, and — for Unix domain sockets — the
  socket file on disk). Every example below is built on this instead of
  wiring `InMemoryItemService` + `startGrpcServer` + `create*Client` by hand.
- `examples/network-client-server` — server and client in one process,
  talking over a real TCP loopback gRPC socket.
- `examples/unix-socket-client-server` — server and client in one process,
  talking over a real gRPC socket again, but bound to a Unix domain socket
  (a temp file under the OS tmp dir) instead of TCP. Still full proto
  serialization, just without the TCP/IP stack -- a common choice for
  same-host IPC.
- `examples/in-process-fast-client` — server and client in one process,
  talking through the zero-serialization local client.

All three examples call `createItemServiceClient` with a different
`ClientTransport` value, run the identical CRUD sequence (`runCrudDemo` in
`packages/service/src/demo.ts`), and print the average latency of 200
`createItem` calls, so you can see the serialization and transport cost
directly. Swapping an example's transport is a one-line change to which
enum value it passes in.

## Migration path

1. **Today**: apps instantiate `InMemoryItemService` directly (current state).
2. **Step 1** (this repo): apps switch to depending on `ItemServiceApi` and
   get one from `createItemServiceClient(ClientTransport.LOCAL)` — zero
   cost, but the seam exists.
3. **Step 2** (this repo): when co-location no longer holds, request
   `ClientTransport.NETWORK` (or `UNIX_DOMAIN_SOCKETS` for same-host IPC)
   instead. Same interface, same call sites — only the enum value passed
   to `createItemServiceClient` changes.
4. **Step 3** (future): move the server side of `createItemServiceClient`'s
   `NETWORK`/`UNIX_DOMAIN_SOCKETS` cases into its own deployable
   process/container; point the client at its real address.

## Running

```bash
yarn install
yarn build

yarn start:network   # client <-> server over a real TCP loopback gRPC socket
yarn start:unix      # client <-> server over a real Unix domain socket
yarn start:local     # client <-> server in-process, no serialization
```

Sample average `createItem` latency across the three, from an actual run:

```
network client (TCP loopback):    0.241ms
unix socket client:                0.212ms
local client (in-process):         0.001ms
```

TCP and the Unix socket are both real proto serialization over a real
socket, so they land in the same ballpark -- the Unix socket skips the
TCP/IP stack but still pays the encode/decode cost. The in-process client
skips serialization entirely, which is the rest of the gap.
