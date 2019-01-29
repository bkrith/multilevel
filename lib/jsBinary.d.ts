/// <reference types="node" />
import { PacketInterface } from './interfaces';
export declare const jsBinary: {
    packet: {
        encode: (data: PacketInterface) => Buffer;
        decode: (data: Buffer) => PacketInterface;
    };
};
