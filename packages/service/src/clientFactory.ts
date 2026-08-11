import fs from "fs";
import os from "os";
import path from "path";
import { InMemoryItemService } from "./handlers";
import { ItemServiceApi } from "./types";
import { startGrpcServer } from "./grpc/server";
import { createNetworkClient } from "./grpc/networkClient";
import { createLocalClient } from "./grpc/localClient";

/**
 * The transports an ItemServiceApi client can be backed by. Every example
 * app picks one of these and gets back an interchangeable client --
 * createItemServiceClient is the one place that knows how to stand up each
 * transport's server (if any), pick its address, and tear it back down.
 */
export enum ClientTransport {
  /** In-process, no serialization: calls straight into the implementation. */
  LOCAL = "LOCAL",
  /** Real gRPC server + client over a TCP loopback socket. */
  NETWORK = "NETWORK",
  /** Real gRPC server + client over a Unix domain socket. */
  UNIX_DOMAIN_SOCKETS = "UNIX_DOMAIN_SOCKETS",
}

export interface CreateClientOptions {
  /** Bind/dial address for ClientTransport.NETWORK. Defaults to an ephemeral loopback port. */
  networkAddress?: string;
  /** Socket file path for ClientTransport.UNIX_DOMAIN_SOCKETS. Defaults to a path in the OS tmp dir. */
  socketPath?: string;
}

export interface ClientHandle {
  /** The client, ready to use -- identical shape regardless of transport. */
  client: ItemServiceApi;
  /** The resolved server address, for transports that have one (undefined for LOCAL). */
  address?: string;
  /**
   * Closes the client and, for network transports, shuts down the server
   * and cleans up anything the client doesn't release on its own -- the
   * gRPC server, its listening socket, and, for Unix domain sockets, the
   * socket file left on disk. Always safe to call, and always the only
   * teardown step callers need regardless of which transport they asked for.
   */
  shutdown(): Promise<void>;
}

/**
 * Dependency-injection style factory: pick a transport, get back a client
 * that implements ItemServiceApi plus a matching shutdown() hook. This is
 * the one thing example apps (or any future caller) need to import instead
 * of hand-wiring InMemoryItemService + startGrpcServer + create*Client
 * themselves.
 */
export async function createItemServiceClient(
  transport: ClientTransport,
  options: CreateClientOptions = {}
): Promise<ClientHandle> {
  switch (transport) {
    case ClientTransport.LOCAL: {
      const impl = new InMemoryItemService();
      const client = createLocalClient(impl);
      return {
        client,
        // No server, no socket, no open connection -- nothing to release.
        shutdown: async () => {},
      };
    }

    case ClientTransport.NETWORK: {
      const impl = new InMemoryItemService();
      const { server, address } = await startGrpcServer(
        impl,
        options.networkAddress ?? "127.0.0.1:0"
      );
      const client = createNetworkClient(address);
      return {
        client,
        address,
        shutdown: async () => {
          client.close();
          server.forceShutdown();
        },
      };
    }

    case ClientTransport.UNIX_DOMAIN_SOCKETS: {
      const socketPath =
        options.socketPath ?? path.join(os.tmpdir(), `grpc-crud-demo-${process.pid}.sock`);
      const address = `unix://${socketPath}`;
      const impl = new InMemoryItemService();
      const { server } = await startGrpcServer(impl, address);
      const client = createNetworkClient(address);
      return {
        client,
        address,
        shutdown: async () => {
          client.close();
          server.forceShutdown();
          await fs.promises.unlink(socketPath).catch(() => {
            /* best-effort cleanup of the socket file in tmp */
          });
        },
      };
    }

    default: {
      const exhaustiveCheck: never = transport;
      throw new Error(`Unknown ClientTransport: ${exhaustiveCheck}`);
    }
  }
}
