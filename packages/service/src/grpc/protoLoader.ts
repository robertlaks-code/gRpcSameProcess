import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ProtoGrpcType } from "../generated/crud";

const PROTO_PATH = path.join(__dirname, "../../proto/crud.proto");

// Options here must match the flags passed to proto-loader-gen-types in
// package.json's "generate" script -- the generated types describe exactly
// what this call produces, nothing more.
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false, // produces camelCase JS field names
  longs: Number, // int64 -> JS number (fine for a demo; use String for real 64-bit safety)
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;

/** The loaded, generated-typed ItemService definition, shared by the server and network client. */
export const ItemServiceDefinition = proto.crud.v1.ItemService;
