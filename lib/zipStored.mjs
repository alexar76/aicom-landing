import { Buffer } from "node:buffer";
import { crc32 } from "./crc32.mjs";

/**
 * One-file ZIP (method STORED). Filename ASCII-only recommended.
 * @param {string} filename e.g. index.html
 * @param {string|Buffer} data
 * @returns {Buffer}
 */
export function zipOneStored(filename, data) {
  const nameBuf = Buffer.from(filename, "utf8");
  const body = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
  const crc = crc32(body);
  const size = body.length;
  const localHeaderLen = 30 + nameBuf.length;
  const centralHeaderLen = 46 + nameBuf.length;
  const localOffset = 0;

  const local = Buffer.alloc(localHeaderLen);
  let p = 0;
  local.writeUInt32LE(0x04034b50, p);
  p += 4;
  local.writeUInt16LE(20, p);
  p += 2; // version
  local.writeUInt16LE(0, p);
  p += 2; // flags
  local.writeUInt16LE(0, p);
  p += 2; // method stored
  local.writeUInt16LE(0, p);
  p += 2; // time
  local.writeUInt16LE(0, p);
  p += 2; // date
  local.writeUInt32LE(crc, p);
  p += 4;
  local.writeUInt32LE(size, p);
  p += 4;
  local.writeUInt32LE(size, p);
  p += 4;
  local.writeUInt16LE(nameBuf.length, p);
  p += 2;
  local.writeUInt16LE(0, p);
  p += 2;
  nameBuf.copy(local, p);

  const centralOffset = localHeaderLen + size;
  const central = Buffer.alloc(centralHeaderLen);
  p = 0;
  central.writeUInt32LE(0x02014b50, p);
  p += 4;
  central.writeUInt16LE(0x0314, p);
  p += 2; // version made by (unix)
  central.writeUInt16LE(20, p);
  p += 2;
  central.writeUInt16LE(0, p);
  p += 2;
  central.writeUInt16LE(0, p);
  p += 2;
  central.writeUInt16LE(0, p);
  p += 2;
  central.writeUInt16LE(0, p);
  p += 2;
  central.writeUInt32LE(crc, p);
  p += 4;
  central.writeUInt32LE(size, p);
  p += 4;
  central.writeUInt32LE(size, p);
  p += 4;
  central.writeUInt16LE(nameBuf.length, p);
  p += 2; // file name length
  central.writeUInt16LE(0, p);
  p += 2; // extra field length
  central.writeUInt16LE(0, p);
  p += 2; // file comment length
  central.writeUInt16LE(0, p);
  p += 2; // disk number start
  central.writeUInt16LE(0, p);
  p += 2; // internal file attributes
  central.writeUInt32LE(0, p);
  p += 4; // external file attributes
  central.writeUInt32LE(localOffset, p);
  p += 4; // relative offset of local header
  nameBuf.copy(central, p);

  const eocd = Buffer.alloc(22);
  p = 0;
  eocd.writeUInt32LE(0x06054b50, p);
  p += 4;
  eocd.writeUInt16LE(0, p);
  p += 2;
  eocd.writeUInt16LE(0, p);
  p += 2;
  eocd.writeUInt16LE(1, p);
  p += 2;
  eocd.writeUInt16LE(1, p);
  p += 2;
  eocd.writeUInt32LE(centralHeaderLen, p);
  p += 4;
  eocd.writeUInt32LE(centralOffset, p);
  p += 4;
  eocd.writeUInt16LE(0, p);
  p += 2;

  return Buffer.concat([local, body, central, eocd]);
}
