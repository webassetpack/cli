
import yargs = require('yargs');
import * as Path from 'path';
import * as FileSystem from 'fs';
import {Stream} from 'stream';
import {IDictionary} from '@totalpave/interfaces';
import {Packer} from './Packer';

const argv = yargs.options({
    d: {
        type: 'string',
        description: 'Path to definition file',
        alias: 'definition',
        demandOption: true
    },
    o: {
        type: 'string',
        description: 'Path to output',
        default: './assets.wap',
        alias: 'output'
    }
}).argv;

let destination: string = Path.resolve(argv.o);
let definitionFile: string = Path.resolve(argv.d);
let definition: IDictionary<string> = require(definitionFile);

let packer: Packer = new Packer(/*destination*/);
packer.pack(definition).then((stream: Stream) => {
    let output: FileSystem.WriteStream = FileSystem.createWriteStream(destination);
    output.on('close', () => {
        // process.nextTick(() => {
        //     process.exit(0);
        // });
    });
    output.on('error', (error: Error) => {
        console.error(error);
    });
    stream.pipe(output);
}).catch((error: Error) => {
    console.error(error);
    process.exit(1);
});
