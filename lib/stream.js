'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const binary_1 = require("./binary");
const stream_1 = require("stream");
class TransformStream extends stream_1.Transform {
    constructor(db, events, opts) {
        super(opts);
        this._chunk = Buffer.from('');
        this._write = function (chunk, enc, cb) {
            this._chunk = Buffer.concat([this._chunk, chunk]);
            this.getChunk().forEach((binPacket) => {
                const packet = binary_1.binary.packet.decode(binPacket);
                if (db && packet.data.parameters) {
                    if (packet.data.method.includes('Stream')) {
                        db[packet.data.method](...packet.data.parameters)
                            .on('data', (data) => {
                            this.push(binary_1.binary.packet.encode(this.formatPacket(packet, data, undefined)));
                        })
                            .on('end', () => {
                            this.push(binary_1.binary.packet.encode(this.formatPacket(packet, undefined, undefined, true)));
                        })
                            .on('error', (err) => {
                            this.push(binary_1.binary.packet.encode(this.formatPacket(packet, undefined, err)));
                        });
                    }
                    else {
                        db[packet.data.method](...packet.data.parameters, (err, value) => {
                            this.push(binary_1.binary.packet.encode(this.formatPacket(packet, value, err)));
                        });
                    }
                }
                else {
                    if (events) {
                        if (packet.data.method.includes('Stream')) {
                            switch (packet.data.method) {
                                case 'createReadStream':
                                    if (packet.data.result)
                                        events.readStream(packet.id).emit('data', packet.data.result);
                                    else if (packet.data.end)
                                        events.readStream(packet.id).emit('end');
                                    else if (packet.data.error)
                                        events.readStream(packet.id).emit('error', packet.data.error);
                                    break;
                                case 'createKeyStream':
                                    if (packet.data.result)
                                        events.keyStream(packet.id).emit('data', packet.data.result);
                                    else if (packet.data.end)
                                        events.keyStream(packet.id).emit('end');
                                    else if (packet.data.error)
                                        events.keyStream(packet.id).emit('error', packet.data.error);
                                    break;
                                case 'createValueStream':
                                    if (packet.data.result)
                                        events.valueStream(packet.id).emit('data', packet.data.result);
                                    else if (packet.data.end)
                                        events.valueStream(packet.id).emit('end');
                                    else if (packet.data.error)
                                        events.valueStream(packet.id).emit('error', packet.data.error);
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
    getChunk(chunks) {
        if (!chunks)
            chunks = [];
        if (this._chunk.length >= 4) {
            const size = this._chunk.readUInt32BE(0);
            if (size <= this._chunk.length) {
                chunks.push(this._chunk.slice(0, size).slice(4));
                this._chunk = this._chunk.slice(size);
                if (this._chunk.length)
                    return this.getChunk(chunks);
                else
                    return chunks;
            }
            else
                return chunks;
        }
        else
            return chunks;
    }
    formatPacket(packet, result, error, end) {
        const err = (error ? (error.message ? error.message : (error.stack ? error.stack : error)) : undefined);
        packet.data.parameters = undefined;
        packet.data.error = err;
        packet.data.result = end ? undefined : (error ? undefined : (result ? result : true));
        packet.data.end = end ? true : undefined;
        return packet;
    }
}
exports.TransformStream = TransformStream;
