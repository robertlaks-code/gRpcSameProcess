import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = path.join(__dirname, "../../proto/crud.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false, // produces camelCase JS field names matching src/types.ts
  longs: Number, // int64 -> JS number (fine for a demo; use String for real 64-bit safety)
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;

/** The loaded ItemService definition, shared by the server and network client. */
export const ItemServiceDefinition = proto.crud.v1.ItemService as grpc.ServiceClientConstructor;
