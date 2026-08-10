import * as grpc from "@grpc/grpc-js";
import { ItemNotFoundError } from "../handlers";
import { ItemServiceClient } from "../types";
import { ItemServiceDefinition } from "./protoLoader";

/**
 * Adapts an ItemServiceClient implementation (typically InMemoryItemService)
 * to gRPC's callback-based handler signature, so it can be served over a
 * real network socket. This is the only file that has to know about gRPC's
 * server-side wire format.
 */
function toGrpcHandler<TReq, TRes>(
  fn: (request: TReq) => Promise<TRes>
): grpc.handleUnaryCall<TReq, TRes> {
  return (call, callback) => {
    fn(call.request)
      .then((response) => callback(null, response))
      .catch((err: unknown) => {
        if (err instanceof ItemNotFoundError) {
          callback({
            code: grpc.status.NOT_FOUND,
            message: err.message,
          });
          return;
        }
        callback({
          code: grpc.status.INTERNAL,
          message: err instanceof Error ? err.message : "internal error",
        });
      });
  };
}

/**
 * Starts a real gRPC server that delegates every RPC to `impl`. Bind this to
 * any address today (localhost, for the in-process demo) and to a real
 * externally-reachable address once the service is split out of the app.
 */
export function startGrpcServer(
  impl: ItemServiceClient,
  address = "127.0.0.1:0"
): Promise<{ server: grpc.Server; address: string }> {
  const server = new grpc.Server();

  server.addService(ItemServiceDefinition.service, {
    createItem: toGrpcHandler(impl.createItem.bind(impl)),
    getItem: toGrpcHandler(impl.getItem.bind(impl)),
    updateItem: toGrpcHandler(impl.updateItem.bind(impl)),
    deleteItem: toGrpcHandler(impl.deleteItem.bind(impl)),
    listItems: toGrpcHandler(impl.listItems.bind(impl)),
  });

  return new Promise((resolve, reject) => {
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ server, address: `127.0.0.1:${port}` });
    });
  });
}
