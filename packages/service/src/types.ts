/**
 * TypeScript mirror of proto/crud.proto.
 *
 * This is the contract every caller of the service codes against, whether
 * the service lives in the same process or behind a real network socket.
 * Field names use camelCase to match what @grpc/proto-loader produces at
 * runtime (loaded with keepCase: false).
 */

export interface Item {
  id: string;
  name: string;
  payload: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateItemRequest {
  name: string;
  payload: string;
}

export interface GetItemRequest {
  id: string;
}

export interface UpdateItemRequest {
  id: string;
  name: string;
  payload: string;
}

export interface DeleteItemRequest {
  id: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeleteItemResponse {}

export interface ListItemsRequest {
  pageSize?: number;
  pageToken?: string;
}

export interface ListItemsResponse {
  items: Item[];
  nextPageToken: string;
}

/**
 * The service contract. Every way of talking to the ItemService -- the raw
 * in-memory implementation, a real gRPC network client, or an in-process
 * client that skips serialization -- implements this same interface.
 * Application code should depend on ItemServiceClient, not on any one
 * transport, so swapping transports never requires touching call sites.
 */
export interface ItemServiceClient {
  createItem(request: CreateItemRequest): Promise<Item>;
  getItem(request: GetItemRequest): Promise<Item>;
  updateItem(request: UpdateItemRequest): Promise<Item>;
  deleteItem(request: DeleteItemRequest): Promise<DeleteItemResponse>;
  listItems(request: ListItemsRequest): Promise<ListItemsResponse>;
}
