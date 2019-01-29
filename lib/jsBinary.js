'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const deserializeBuffer = (json) => {
    Object.keys(json).forEach((key) => {
        if (json[key] && json[key].type && json[key].type === 'Buffer') {
            json[key] = Buffer.from(json[key].data);
        }
        else if (json[key] && typeof (json[key]) === 'object' && Object.keys(json[key]).length) {
            json[key] = deserializeBuffer(json[key]);
        }
    });
    return json;
};
exports.jsBinary = {
    packet: {
        encode: (data) => {
            const binPacket = Buffer.from(JSON.stringify(data));
            const packet = Buffer.concat([Buffer.alloc(4), binPacket]);
            packet.writeUInt32BE(binPacket.length + 4, 0);
            return packet;
        },
        decode: (data) => {
            return deserializeBuffer(JSON.parse(data.toString()));
        }
    }
};
