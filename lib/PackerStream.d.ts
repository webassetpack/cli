/// <reference types="node" />
import { Transform, TransformOptions, TransformCallback } from 'stream';
export declare class PackerStream extends Transform {
    private _hash;
    private _sha1;
    private _needsToIgnoreHeader;
    private _manifestLength;
    constructor(opts?: TransformOptions);
    getChecksum(): string;
    _transform(chunk: Buffer, enc: string, cb: TransformCallback): void;
}
