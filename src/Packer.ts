
import * as FileSystem from 'fs';
import * as Path from 'path';
import * as Zlib from 'zlib';
import * as OS from 'os';
import * as Crypto from 'crypto';
import {
    Manifest,
    BYTE_POS_VERSION_MAJOR,
    BYTE_POS_VERSION_MINOR,
    BYTE_POS_VERSION_PATCH,
    BYTE_POS_MANIFEST_LENGTH
} from '@wap/core';
import {IDictionary} from '@totalpave/interfaces';

/*
TODO
    - Security: Utilize checksums to ensure that the final written file is what we expect datawise.
        * This should prevent malicious programs for listening and writing data or executable code into the WAP file without the user knowing.
*/

export class Packer {
    private _destination: string;
    private _tempFile: string;
    private _fd: FileSystem.WriteStream;

    constructor(destination: string) {
        this._destination = destination;
        this._tempFile = this._getTempPath();
        this._fd = FileSystem.createWriteStream(this._tempFile);
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

    public async pack(definition: IDictionary<string>): Promise<void> {
        let manifest: Manifest = {};

        for (let name in definition) {
            let path: string = Path.resolve(definition[name]);
            let stat: FileSystem.Stats = FileSystem.lstatSync(path);
            if (stat.isFile()) {
                let buffer: Buffer = await this._packFile(path);
                manifest[name] = {
                    start: this._fd.bytesWritten,
                    end: this._fd.bytesWritten + buffer.byteLength
                };
                await this._writeToIntermediate(buffer);
            }
        }

        this._fd.close();

        return new Promise<void>((resolve, reject) => {
            let manifestBuffer: Buffer = Buffer.from(JSON.stringify(manifest));
            let manifestLength: number = manifestBuffer.byteLength;
            let headerBuffer: Buffer = Buffer.alloc(8);
            let version: IDictionary<number> = this.getVersion();
            headerBuffer.writeUInt16LE(version.major, BYTE_POS_VERSION_MAJOR);
            headerBuffer.writeUInt16LE(version.minor, BYTE_POS_VERSION_MINOR);
            headerBuffer.writeUInt16LE(version.patch, BYTE_POS_VERSION_PATCH);
            headerBuffer.writeUInt16LE(manifestLength, BYTE_POS_MANIFEST_LENGTH);

            let output: FileSystem.WriteStream = FileSystem.createWriteStream(this._destination);
            output.write(headerBuffer);
            output.write(manifestBuffer);
            output.on('close', () => {
                resolve();
            });
            output.on('error', (error: Error) => {
                reject(error);
            });
            FileSystem.createReadStream(this._tempFile).pipe(output);
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
            let deflator: Zlib.DeflateRaw = Zlib.createDeflateRaw();
            let readStream: FileSystem.ReadStream = FileSystem.createReadStream(path);
            let buffer: Buffer = null;
            deflator.on('data', (chunk: any) => {
                if (buffer === null) {
                    buffer = chunk;
                }
                else {
                    buffer = Buffer.concat([ buffer, chunk ]);
                }
            });
            deflator.on('close', () => {
                resolve(buffer);
            });
            deflator.on('error', (error: Error) => {
                reject(error);
            });
            readStream.pipe(deflator);
        });
    }
}

// let packer: Packer = new Packer('./test.wap');
// packer.pack([ './package.json', './tsconfig.json' ]);
