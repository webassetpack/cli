
import * as FileSystem from 'fs';
import * as Path from 'path';
// import * as Zlib from 'zlib';
import * as Pako from 'pako';
import * as OS from 'os';
import * as Crypto from 'crypto';
import {
    Manifest,
    BYTE_POS_VERSION_MAJOR,
    BYTE_POS_VERSION_MINOR,
    BYTE_POS_VERSION_PATCH,
    BYTE_POS_MANIFEST_LENGTH
    // BYTE_HEADER_SIZE
} from '@wap/core';
import {IDictionary} from '@totalpave/interfaces';
import {Stream} from 'stream';
import {PackerStream} from './PackerStream';

export class Packer {
    // private _destination: string;
    private _tempFile: string;
    private _fd: FileSystem.WriteStream;
    private _hash: Crypto.Hash;
    private _sha1: string;

    constructor(/*destination: string*/) {
        // this._destination = destination;
        this._tempFile = this._getTempPath();
        this._fd = FileSystem.createWriteStream(this._tempFile);
        this._hash = Crypto.createHash('sha1');
        this._sha1 = null;
    }

    private _generateRandomChars(): string {
        return Crypto.randomBytes(20).toString('hex');
    }

    private _getTempPath(): string {
        return Path.resolve(OS.tmpdir(), `wap-packer-${this._generateRandomChars()}.intermediate`);
    }

    public getVersion(): IDictionary<number> {
        let pkg: any = require('../package.json');
        let str: string = pkg.version;
        let parts: Array<string> = str.split('.');
        return {
            major: parseInt(parts[0]),
            minor: parseInt(parts[1]),
            patch: parseInt(parts[2].split('-')[0])
        };
    }

    public async pack(definition: IDictionary<string>): Promise<Stream> {
        let manifest: Manifest = {};

        for (let name in definition) {
            let path: string = Path.resolve(definition[name]);
            let stat: FileSystem.Stats = FileSystem.lstatSync(path);
            if (stat.isFile()) {
                let buffer: Buffer = await this._packFile(path);
                manifest[name] = {
                    start: this._fd.bytesWritten,
                    end: this._fd.bytesWritten + buffer.byteLength,
                    useCompression: true
                };
                this._hash.update(buffer);
                await this._writeToIntermediate(buffer);
            }
        }

        this._sha1 = this._hash.digest('hex');
        this._fd.close();

        return new Promise<Stream>((resolve, reject) => {
            let manifestBuffer: Buffer = Buffer.from(JSON.stringify(manifest));
            let manifestLength: number = manifestBuffer.byteLength;
            let headerBuffer: Buffer = Buffer.alloc(8);
            let version: IDictionary<number> = this.getVersion();
            headerBuffer.writeUInt16BE(version.major, BYTE_POS_VERSION_MAJOR);
            headerBuffer.writeUInt16BE(version.minor, BYTE_POS_VERSION_MINOR);
            headerBuffer.writeUInt16BE(version.patch, BYTE_POS_VERSION_PATCH);
            headerBuffer.writeUInt16BE(manifestLength, BYTE_POS_MANIFEST_LENGTH);

            let stream: PackerStream = new PackerStream();
            stream.write(headerBuffer);
            stream.write(manifestBuffer);
            FileSystem.createReadStream(this._tempFile).pipe(stream);
            stream.on('finish', () => {
                if (stream.getChecksum() !== this._sha1) {
                    throw new Error(`Checksum failed: Expected "${this._sha1}" but got "${stream.getChecksum()}"`);
                }
            });
            resolve(stream);
        });
    }

    private _writeToIntermediate(buffer: Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._fd.write(buffer, (error: Error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }

    private _packFile(path: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            
            // let deflator: Zlib.DeflateRaw = Zlib.createDeflateRaw();
            let readStream: FileSystem.ReadStream = FileSystem.createReadStream(path);
            let deflator: Pako.Deflate = new Pako.Deflate();
            // let buffer: Buffer = null;

            readStream.on('data', (chunk: Buffer) => {
                deflator.push(chunk, false);
            });
            readStream.on('end', () => {
                deflator.push(null, true);

                // buffer = ;
                resolve(Buffer.from(deflator.result));
            });

            // deflator.on('data', (chunk: any) => {
            //     if (buffer === null) {
            //         buffer = chunk;
            //     }
            //     else {
            //         buffer = Buffer.concat([ buffer, chunk ]);
            //     }
            // });
            // deflator.on('finish', () => {
            //     resolve(buffer);
            // });
            // deflator.on('error', (error: Error) => {
            //     reject(error);
            // });
            // readStream.pipe(deflator);
        });
    }
}

// let packer: Packer = new Packer('./test.wap');
// packer.pack([ './package.json', './tsconfig.json' ]);
