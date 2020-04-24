import { IDictionary } from '@totalpave/interfaces';
export declare class Packer {
    private _destination;
    private _tempFile;
    private _fd;
    private _hash;
    private _sha1;
    constructor(destination: string);
    private _generateRandomChars;
    private _getTempPath;
    getVersion(): IDictionary<number>;
    pack(definition: IDictionary<string>): Promise<void>;
    private _verify;
    private _writeToIntermediate;
    private _packFile;
}
