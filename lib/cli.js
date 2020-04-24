"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const Path = require("path");
const Packer_1 = require("./Packer");
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
let destination = Path.resolve(argv.o);
let definitionFile = Path.resolve(argv.d);
let definition = require(definitionFile);
let packer = new Packer_1.Packer(destination);
packer.pack(definition).then(() => {
    process.nextTick(() => {
        process.exit(0);
    });
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map