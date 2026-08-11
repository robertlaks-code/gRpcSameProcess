import { randomUUID } from "crypto";
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
} from "./types";

export class ItemNotFoundError extends Error {
  constructor(id: string) {
    super(`item not found: ${id}`);
    this.name = "ItemNotFoundError";
  }
}

/**
 * The actual business logic for the ItemService, kept deliberately
 * transport-agnostic: it knows nothing about gRPC, proto encoding, or
 * networking. This is equivalent to today's "library package" that
 * application code used to instantiate directly.
 *
 * Both the gRPC server and the in-process fast client sit in front of an
 * instance of this class -- the server delegates to it over the wire, the
 * fast client delegates to it directly in memory.
 */
export class InMemoryItemService implements ItemServiceApi {
  private readonly items = new Map<string, Item>();

  async createItem(request: CreateItemRequest): Promise<Item> {
    const now = Date.now();
    const item: Item = {
      id: randomUUID(),
      name: request.name,
      payload: request.payload,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, item);
    return item;
  }

  async getItem(request: GetItemRequest): Promise<Item> {
    const item = this.items.get(request.id);
    if (!item) {
      throw new ItemNotFoundError(request.id);
    }
    return item;
  }

  async updateItem(request: UpdateItemRequest): Promise<Item> {
    const existing = this.items.get(request.id);
    if (!existing) {
      throw new ItemNotFoundError(request.id);
    }
    const updated: Item = {
      ...existing,
      name: request.name,
      payload: request.payload,
      updatedAt: Date.now(),
    };
    this.items.set(updated.id, updated);
    return updated;
  }

  async deleteItem(request: DeleteItemRequest): Promise<DeleteItemResponse> {
    if (!this.items.has(request.id)) {
      throw new ItemNotFoundError(request.id);
    }
    this.items.delete(request.id);
    return {};
  }

  async listItems(request: ListItemsRequest): Promise<ListItemsResponse> {
    const all = Array.from(this.items.values()).sort(
      (a, b) => a.createdAt - b.createdAt
    );
    const pageSize = request.pageSize > 0 ? request.pageSize : all.length;
    const start = request.pageToken ? Number(request.pageToken) : 0;
    const page = all.slice(start, start + pageSize);
    const nextStart = start + page.length;
    return {
      items: page,
      nextPageToken: nextStart < all.length ? String(nextStart) : "",
    };
  }
}
