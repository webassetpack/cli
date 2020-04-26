"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const FileSystem = require("fs");
const Path = require("path");
const Zlib = require("zlib");
const OS = require("os");
const Crypto = require("crypto");
const core_1 = require("@wap/core");
const PackerStream_1 = require("./PackerStream");
class Packer {
    constructor( /*destination: string*/) {
        // this._destination = destination;
        this._tempFile = this._getTempPath();
        this._fd = FileSystem.createWriteStream(this._tempFile);
        this._hash = Crypto.createHash('sha1');
        this._sha1 = null;
    }
    _generateRandomChars() {
        return Crypto.randomBytes(20).toString('hex');
    }
    _getTempPath() {
        return Path.resolve(OS.tmpdir(), `wap-packer-${this._generateRandomChars()}.intermediate`);
    }
    getVersion() {
        let pkg = require('../package.json');
        let str = pkg.version;
        let parts = str.split('.');
        return {
            major: parseInt(parts[0]),
            minor: parseInt(parts[1]),
            patch: parseInt(parts[2].split('-')[0])
        };
    }
    pack(definition) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let manifest = {};
            for (let name in definition) {
                let path = Path.resolve(definition[name]);
                let stat = FileSystem.lstatSync(path);
                if (stat.isFile()) {
                    let buffer = yield this._packFile(path);
                    manifest[name] = {
                        start: this._fd.bytesWritten,
                        end: this._fd.bytesWritten + buffer.byteLength
                    };
                    this._hash.update(buffer);
                    yield this._writeToIntermediate(buffer);
                }
            }
            this._sha1 = this._hash.digest('hex');
            this._fd.close();
            return new Promise((resolve, reject) => {
                let manifestBuffer = Buffer.from(JSON.stringify(manifest));
                let manifestLength = manifestBuffer.byteLength;
                let headerBuffer = Buffer.alloc(8);
                let version = this.getVersion();
                headerBuffer.writeUInt16LE(version.major, core_1.BYTE_POS_VERSION_MAJOR);
                headerBuffer.writeUInt16LE(version.minor, core_1.BYTE_POS_VERSION_MINOR);
                headerBuffer.writeUInt16LE(version.patch, core_1.BYTE_POS_VERSION_PATCH);
                headerBuffer.writeUInt16LE(manifestLength, core_1.BYTE_POS_MANIFEST_LENGTH);
                let stream = new PackerStream_1.PackerStream();
                stream.write(headerBuffer);
                stream.write(manifestBuffer);
                FileSystem.createReadStream(this._tempFile).pipe(stream);
                stream.on('close', () => {
                    if (stream.getChecksum() !== this._sha1) {
                        throw new Error(`Checksum failed: Expected "${this._sha1}" but got "${stream.getChecksum()}"`);
                    }
                });
                resolve(stream);
                // let output: FileSystem.WriteStream = FileSystem.createWriteStream(this._destination);
                // output.write(headerBuffer);
                // output.write(manifestBuffer);
                // output.on('close', () => {
                //     this._verify().then(() => {
                //         resolve();
                //     }).catch(reject);
                // });
                // output.on('error', (error: Error) => {
                //     reject(error);
                // });
                // FileSystem.createReadStream(this._tempFile).pipe(output);
            });
        });
    }
    // private _verify(): Promise<void> {
    //     return new Promise<void>((resolve, reject) => {
    //         let hash: Crypto.Hash = Crypto.createHash('sha1');
    //         let readStream: FileSystem.ReadStream = FileSystem.createReadStream(this._destination);
    //         let needsToIgnoreHeader: boolean = true;
    //         readStream.on('data', (chunk: Buffer) => {
    //             let data: Buffer = null;
    //             let manifestLength: number = null;
    //             if (needsToIgnoreHeader) {
    //                 if (manifestLength === null) {
    //                     manifestLength = chunk.readUInt16LE(BYTE_POS_MANIFEST_LENGTH) + BYTE_HEADER_SIZE;
    //                 }
    //                 if (chunk.byteLength < manifestLength) {
    //                     // We don't have the complete header + manifest yet
    //                     // so subtract this byte length and wait for the next chunk
    //                     manifestLength -= chunk.byteLength;
    //                     return;
    //                 }
    //                 else {
    //                     needsToIgnoreHeader = false;
    //                     data = chunk.slice(manifestLength);
    //                 }
    //             }
    //             else {
    //                 data = chunk;
    //             }
    //             hash.update(data);
    //         });
    //         readStream.on('end', () => {
    //             let digest: string = hash.digest('hex');
    //             if (digest === this._sha1) {
    //                 resolve();
    //             }
    //             else {
    //                 reject(new Error(`Checksum failed: Expected "${this._sha1}" but got "${digest}"`));
    //             }
    //         });
    //     });
    // }
    _writeToIntermediate(buffer) {
        return new Promise((resolve, reject) => {
            this._fd.write(buffer, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    _packFile(path) {
        return new Promise((resolve, reject) => {
            let deflator = Zlib.createDeflateRaw();
            let readStream = FileSystem.createReadStream(path);
            let buffer = null;
            deflator.on('data', (chunk) => {
                if (buffer === null) {
                    buffer = chunk;
                }
                else {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            });
            deflator.on('close', () => {
                resolve(buffer);
            });
            deflator.on('error', (error) => {
                reject(error);
            });
            readStream.pipe(deflator);
        });
    }
}
exports.Packer = Packer;
// let packer: Packer = new Packer('./test.wap');
// packer.pack([ './package.json', './tsconfig.json' ]);
//# sourceMappingURL=Packer.js.map