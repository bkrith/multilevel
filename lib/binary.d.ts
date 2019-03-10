/// <reference types="node" />
import { PacketInterface } from './interfaces';
export declare const binary: {
    packet: {
        encode: (data: PacketInterface) => Buffer;
        decode: (data: Buffer) => PacketInterface;
    };
};
