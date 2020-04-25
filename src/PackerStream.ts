
import {
    Transform,
    TransformOptions,
    TransformCallback
} from 'stream';
import * as Crypto from 'crypto';
import { BYTE_POS_MANIFEST_LENGTH, BYTE_HEADER_SIZE } from '@wap/core';

export class PackerStream extends Transform {
    private _hash: Crypto.Hash;
    private _sha1: string;
    private _needsToIgnoreHeader: boolean;
    private _manifestLength: number;

    public constructor(opts?: TransformOptions) {
        super(opts);
        this._needsToIgnoreHeader = true;
        this._manifestLength = null;
        this._hash = Crypto.createHash('sha1');
    }

    public getChecksum(): string {
        return this._hash.copy().digest('hex');
    }

    public _transform(chunk: Buffer, enc: string, cb: TransformCallback): void {
        let doHashUpdate: boolean = true;
        let data: Buffer = null;

        if (this._needsToIgnoreHeader) {
            if (this._manifestLength === null) {
                this._manifestLength = chunk.readUInt16LE(BYTE_POS_MANIFEST_LENGTH) + BYTE_HEADER_SIZE;
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
            console.log('HASH UPDATE');
            this._hash.update(data);
        }

        this.push(chunk);
        cb();
    }
}

// export class PackerStream extends Duplex {
//     private _in: PassThrough;
//     private _out: PassThrough;
//     private _handlersConfigured: boolean;
//     private _hash: Crypto.Hash;
//     private _sha1: string;
//     private _needsToIgnoreHeader: boolean;
//     private _manifestLength: number;

//     public constructor(opts?: DuplexOptions) {
//         super(opts)

//         this._needsToIgnoreHeader = true;
//         this._in = new PassThrough();
//         this._out = new PassThrough();
//         this._handlersConfigured = false;
//         this._manifestLength = null;
//         this._hash = Crypto.createHash('sha1');
//     }

//     public getChecksum(): string {
//         return this._sha1;
//     }

//     private _setupHandlers(n: number): void {
//         if (!this._handlersConfigured) {
//             this._handlersConfigured = true;
//             this._out.on('readable', () => {
//                 this._read(n);
//             });
//             this._out.on('end', () => {
//                 this._sha1 = this._hash.digest('hex');
//                 this.push(null);
//             });
//         }
//     }

//     public _write(chunk: Buffer, enc: string, cb: () => void): void {
//         this._in.write(chunk, enc, cb);
//     }

//     public _read(n: number): void {
//         if (!this._handlersConfigured) {
//             return this._setupHandlers(n);
//         }
        
//         let chunk: Buffer = null;
//         while (null !== (chunk = this._out.read(n))) {
//             console.log('CHUNK');

//             let doHashUpdate: boolean = true;
//             let data: Buffer = null;

//             if (this._needsToIgnoreHeader) {
//                 if (this._manifestLength === null) {
//                     this._manifestLength = chunk.readUInt16LE(BYTE_POS_MANIFEST_LENGTH) + BYTE_HEADER_SIZE;
//                 }

//                 if (chunk.byteLength < this._manifestLength) {
//                     this._manifestLength -= chunk.byteLength;
//                     doHashUpdate = false;
//                 }
//                 else {
//                     this._needsToIgnoreHeader = false;
//                     data = chunk.slice(this._manifestLength);
//                 }
//             }
//             else {
//                 data = chunk;
//             }

//             if (doHashUpdate) {
//                 console.log('HASH UPDATE');
//                 this._hash.update(data);
//             }
            
//             if (!this.push(chunk)) {
//                 break;
//             }
//         }
//     }
// }