import * as grpc from "@grpc/grpc-js";
import { ItemNotFoundError } from "../handlers";
import { ItemServiceApi } from "../types";
import { ItemServiceHandlers } from "../generated/crud/v1/ItemService";
import { ItemServiceDefinition } from "./protoLoader";

/**
 * Adapts an ItemServiceApi implementation (typically InMemoryItemService)
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
 *
 * The `satisfies ItemServiceHandlers` check below is generated straight from
 * the .proto -- if a method is renamed or its signature changes there,
 * this file fails to compile instead of failing at runtime.
 */
export function startGrpcServer(
  impl: ItemServiceApi,
  address = "127.0.0.1:0"
): Promise<{ server: grpc.Server; address: string }> {
  const server = new grpc.Server();

  // Keys here are the exact rpc names from the .proto (PascalCase) --
  // that's what the generated ItemServiceHandlers type requires.
  const handlers: ItemServiceHandlers = {
    CreateItem: toGrpcHandler(impl.createItem.bind(impl)),
    GetItem: toGrpcHandler(impl.getItem.bind(impl)),
    UpdateItem: toGrpcHandler(impl.updateItem.bind(impl)),
    DeleteItem: toGrpcHandler(impl.deleteItem.bind(impl)),
    ListItems: toGrpcHandler(impl.listItems.bind(impl)),
  };

  server.addService(ItemServiceDefinition.service, handlers);

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
