import { inflateRawSync } from "node:zlib";

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

const readUint16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
const readUint32 = (bytes, offset) => (
  bytes[offset]
  | (bytes[offset + 1] << 8)
  | (bytes[offset + 2] << 16)
  | (bytes[offset + 3] << 24)
) >>> 0;

const findEndOfCentralDirectory = (bytes) => {
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 0xffff - 22); offset -= 1) {
    if (readUint32(bytes, offset) === END_OF_CENTRAL_DIRECTORY) return offset;
  }
  throw new Error("ZIP end-of-central-directory record was not found.");
};

/**
 * Read ZIP entries produced by the runtime archive contract.
 * This is test-only code, deliberately limited to stored and deflated entries.
 */
export const readZipEntries = (archive) => {
  const bytes = archive instanceof Uint8Array ? archive : new Uint8Array(archive);
  const endOffset = findEndOfCentralDirectory(bytes);
  const entryCount = readUint16(bytes, endOffset + 10);
  let offset = readUint32(bytes, endOffset + 16);
  const decoder = new TextDecoder();
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (readUint32(bytes, offset) !== CENTRAL_DIRECTORY_HEADER) {
      throw new Error(`ZIP central-directory entry ${index} is invalid.`);
    }
    const method = readUint16(bytes, offset + 10);
    const compressedSize = readUint32(bytes, offset + 20);
    const fileNameLength = readUint16(bytes, offset + 28);
    const extraLength = readUint16(bytes, offset + 30);
    const commentLength = readUint16(bytes, offset + 32);
    const localHeaderOffset = readUint32(bytes, offset + 42);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + fileNameLength));

    if (readUint32(bytes, localHeaderOffset) !== LOCAL_FILE_HEADER) {
      throw new Error(`ZIP local-file header for ${name} is invalid.`);
    }
    const localNameLength = readUint16(bytes, localHeaderOffset + 26);
    const localExtraLength = readUint16(bytes, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
    if (method === 0) entries.set(name, compressed);
    else if (method === 8) entries.set(name, new Uint8Array(inflateRawSync(compressed)));
    else throw new Error(`ZIP entry ${name} has unsupported compression method ${method}.`);

    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
};
