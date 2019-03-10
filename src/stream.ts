
'use strict';

import { binary } from './binary';
import { PacketInterface } from './interfaces';
import { Transform } from 'stream';
import { MultiLevel } from './multilevel';

export class TransformStream extends Transform {

    private _chunk: Buffer;

    constructor(db?: any, events?: MultiLevel, opts?: any) {
        super(opts);

        this._chunk = Buffer.from('');

        this._write = function (chunk: Buffer, enc: any, cb: any) {
            this._chunk = Buffer.concat([this._chunk, chunk]);

            this.getChunk().forEach((binPacket: Buffer) => {
                const packet = binary.packet.decode(binPacket);

                if (db && packet.data.parameters) {
                    if (packet.data.method.includes('Stream')) {
                        db[packet.data.method](...packet.data.parameters)
                            .on('data', (data: any) => {
                                this.push(binary.packet.encode(this.formatPacket(packet, data, undefined)));
                            })
                            .on('end', () => {
                                this.push(binary.packet.encode(this.formatPacket(packet, undefined, undefined, true)));
                            })
                            .on('error', (err: any) => {
                                this.push(binary.packet.encode(this.formatPacket(packet, undefined, err)));
                            });
                    }
                    else {
                        db[packet.data.method](...packet.data.parameters, (err: any, value?: any) => {
                            this.push(binary.packet.encode(this.formatPacket(packet, value, err)));
                        });
                    }
                }
                else {
                    if (events) {
                        if (packet.data.method.includes('Stream')) {
                            switch (packet.data.method) {
                                case 'createReadStream':
                                    if (packet.data.result) events.readStream.emit('data', packet.data.result);
                                    else if (packet.data.end) events.readStream.emit('end');
                                    else if (packet.data.error) events.readStream.emit('error', packet.data.error);
                                    break;
                                case 'createKeyStream':
                                    if (packet.data.result) events.keyStream.emit('data', packet.data.result);
                                    else if (packet.data.end) events.keyStream.emit('end');
                                    else if (packet.data.error) events.keyStream.emit('error', packet.data.error);
                                    break;
                                case 'createValueStream':
                                    if (packet.data.result) events.valueStream.emit('data', packet.data.result);
                                    else if (packet.data.end) events.valueStream.emit('end');
                                    else if (packet.data.error) events.valueStream.emit('error', packet.data.error);
                                    break;
                            }
                        }
                        else {
                            events.emit(packet.id, packet.data.result, packet.data.error);
                        }
                    }
                }
            });

            cb();
        };
    }

    private getChunk(chunks?: Buffer[]): Buffer[] {
        if (!chunks) chunks = [];

        if (this._chunk.length >= 4) {
            const size = this._chunk.readUInt32BE(0);

            if (size <= this._chunk.length) {
                chunks.push(this._chunk.slice(0, size).slice(4));
                this._chunk = this._chunk.slice(size);

                if (this._chunk.length) return this.getChunk(chunks);
                else return chunks;
            }
            else return chunks;
        }
        else return chunks;
    }

    private formatPacket(packet: PacketInterface, result: any, error: any, end?: boolean): PacketInterface {
        const err = (error ? (error.message ? error.message : (error.stack ? error.stack : error)) : undefined);
        packet.data.parameters = undefined;
        packet.data.error = err;
        packet.data.result = end ? undefined : (error ? undefined : (result ? result : true));
        packet.data.end = end ? true : undefined;

        return packet;
    }
}
