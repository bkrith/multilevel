/// <reference types="node" />
import { Transform } from 'stream';
import { MultiLevel } from './multilevel';
export declare class TransformStream extends Transform {
    private _chunk;
    constructor(db?: any, events?: MultiLevel, opts?: any);
    private getChunk;
    private formatPacket;
}
