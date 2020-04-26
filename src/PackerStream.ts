
import {
    Transform,
    TransformOptions,
    TransformCallback
} from 'stream';
import * as Crypto from 'crypto';
import { BYTE_POS_MANIFEST_LENGTH, BYTE_HEADER_SIZE } from '@wap/core';

export class PackerStream extends Transform {
    private _hash: Crypto.Hash;
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
            this._hash.update(data);
        }

        this.push(chunk);
        cb();
    }
}
