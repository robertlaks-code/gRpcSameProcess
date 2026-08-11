import * as grpc from "@grpc/grpc-js";
import { ItemNotFoundError } from "../handlers";
import {
  CreateItemRequest,
  DeleteItemRequest,
  DeleteItemResponse,
  GetItemRequest,
  Item,
  ItemServiceApi,
  ListItemsRequest,
  ListItemsResponse,
  UpdateItemRequest,
} from "../types";
import { ItemServiceDefinition } from "./protoLoader";

function promisify<TReq, TRes>(
  method: (request: TReq, callback: (err: grpc.ServiceError | null, response?: TRes) => void) => void
) {
  return (request: TReq): Promise<TRes> =>
    new Promise((resolve, reject) => {
      method(request, (err, response) => {
        if (err) {
          if (err.code === grpc.status.NOT_FOUND) {
            reject(new ItemNotFoundError((request as { id?: string }).id ?? "<unknown>"));
            return;
          }
          reject(err);
          return;
        }
        resolve(response as TRes);
      });
    });
}

/**
 * A typical gRPC client: it dials an address, sends real proto-encoded
 * requests over the wire, and decodes real proto responses. This is the
 * transport an application should use once the ItemService is deployed as
 * its own process -- the only thing that changes later is the `address`.
 *
 * `client` below is the type generated straight from crud.proto
 * (ItemServiceClient in generated/crud/v1/ItemService.ts) -- there is no
 * hand-written client type to keep in sync with the .proto.
 */
export function createNetworkClient(address: string): ItemServiceApi & { close(): void } {
  const client = new ItemServiceDefinition(address, grpc.credentials.createInsecure());

  const createItem = promisify<CreateItemRequest, Item>(client.createItem.bind(client));
  const getItem = promisify<GetItemRequest, Item>(client.getItem.bind(client));
  const updateItem = promisify<UpdateItemRequest, Item>(client.updateItem.bind(client));
  const deleteItem = promisify<DeleteItemRequest, DeleteItemResponse>(client.deleteItem.bind(client));
  const listItems = promisify<ListItemsRequest, ListItemsResponse>(client.listItems.bind(client));

  return {
    createItem,
    getItem,
    updateItem,
    deleteItem,
    listItems,
    close: () => client.close(),
  };
}
