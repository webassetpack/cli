/// <reference types="node" />
import { IDictionary } from '@totalpave/interfaces';
import { Stream } from 'stream';
export declare class Packer {
    private _tempFile;
    private _fd;
    private _hash;
    private _sha1;
    constructor();
    private _generateRandomChars;
    private _getTempPath;
    getVersion(): IDictionary<number>;
    pack(definition: IDictionary<string>): Promise<Stream>;
    private _writeToIntermediate;
    private _packFile;
}
