import { ItemServiceApi } from "../types";

/**
 * An in-process client for when the ItemService implementation lives in the
 * same process and the same trust boundary as the caller.
 *
 * It implements the exact same ItemServiceApi interface as
 * createNetworkClient, so application code is unchanged if this is later
 * swapped for a real network client -- but every call here is a direct
 * function call into `impl`. There is no proto encoding, no proto decoding,
 * and no socket/IPC hop, which is what makes this faster than the network
 * client for the same-process case.
 *
 * Use this when the service and its caller are always co-located and you
 * want to keep the client/server seam in the code (for a future move to a
 * real network) without paying serialization cost today.
 */
export function createLocalClient(impl: ItemServiceApi): ItemServiceApi {
  return {
    createItem: (request) => impl.createItem(request),
    getItem: (request) => impl.getItem(request),
    updateItem: (request) => impl.updateItem(request),
    deleteItem: (request) => impl.deleteItem(request),
    listItems: (request) => impl.listItems(request),
  };
}
