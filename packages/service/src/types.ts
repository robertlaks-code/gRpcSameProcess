/**
 * Message shapes (Item, CreateItemRequest, etc.) are no longer hand-mirrored
 * here -- they're generated straight from proto/crud.proto by
 * `proto-loader-gen-types` (see the "generate" script and src/generated/,
 * which is regenerated on every build and not checked in). This file keeps
 * only the one thing that isn't generated: the transport-agnostic call
 * contract our own code is written against.
 */
import { Item__Output } from "./generated/crud/v1/Item";
import { CreateItemRequest__Output } from "./generated/crud/v1/CreateItemRequest";
import { GetItemRequest__Output } from "./generated/crud/v1/GetItemRequest";
import { UpdateItemRequest__Output } from "./generated/crud/v1/UpdateItemRequest";
import { DeleteItemRequest__Output } from "./generated/crud/v1/DeleteItemRequest";
import { DeleteItemResponse__Output } from "./generated/crud/v1/DeleteItemResponse";
import { ListItemsRequest__Output } from "./generated/crud/v1/ListItemsRequest";
import { ListItemsResponse__Output } from "./generated/crud/v1/ListItemsResponse";

// Re-export the generated "__Output" message shapes (fully-populated,
// decoded form) under the plain names application code actually wants to
// use. There's exactly one alias per message -- no re-declared fields.
export type Item = Item__Output;
export type CreateItemRequest = CreateItemRequest__Output;
export type GetItemRequest = GetItemRequest__Output;
export type UpdateItemRequest = UpdateItemRequest__Output;
export type DeleteItemRequest = DeleteItemRequest__Output;
export type DeleteItemResponse = DeleteItemResponse__Output;
export type ListItemsRequest = ListItemsRequest__Output;
export type ListItemsResponse = ListItemsResponse__Output;

/**
 * The service contract. Every way of talking to the ItemService -- the raw
 * in-memory implementation, a real gRPC network client, or an in-process
 * client that skips serialization -- implements this same interface.
 * Application code should depend on ItemServiceApi, not on any one
 * transport, so swapping transports never requires touching call sites.
 *
 * This is deliberately a plain Promise-based interface, distinct from the
 * generated `ItemServiceClient` (callback-based, extends grpc.Client) --
 * that generated type describes the wire client; this describes what our
 * application code calls.
 */
export interface ItemServiceApi {
  createItem(request: CreateItemRequest): Promise<Item>;
  getItem(request: GetItemRequest): Promise<Item>;
  updateItem(request: UpdateItemRequest): Promise<Item>;
  deleteItem(request: DeleteItemRequest): Promise<DeleteItemResponse>;
  listItems(request: ListItemsRequest): Promise<ListItemsResponse>;
}
