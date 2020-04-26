"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const Crypto = require("crypto");
const core_1 = require("@wap/core");
class PackerStream extends stream_1.Transform {
    constructor(opts) {
        super(opts);
        this._needsToIgnoreHeader = true;
        this._manifestLength = null;
        this._hash = Crypto.createHash('sha1');
    }
    getChecksum() {
        return this._hash.copy().digest('hex');
    }
    _transform(chunk, enc, cb) {
        let doHashUpdate = true;
        let data = null;
        if (this._needsToIgnoreHeader) {
            if (this._manifestLength === null) {
                this._manifestLength = chunk.readUInt16LE(core_1.BYTE_POS_MANIFEST_LENGTH) + core_1.BYTE_HEADER_SIZE;
            }
            if (chunk.byteLength < this._manifestLength) {
                this._manifestLength -= chunk.byteLength;
                doHashUpdate = false;
            }
            else {
                this._needsToIgnoreHeader = false;
                data = chunk.slice(this._manifestLength);
            }
        }
        else {
            data = chunk;
        }
        if (doHashUpdate) {
            this._hash.update(data);
        }
        this.push(chunk);
        cb();
    }
}
exports.PackerStream = PackerStream;
//# sourceMappingURL=PackerStream.js.map