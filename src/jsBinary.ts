
'use strict';

import { PacketInterface } from './interfaces';

const deserializeBuffer = (json: any): any => {
    Object.keys(json).forEach((key) => {
        if (json[key] && json[key].type && json[key].type === 'Buffer') {
            json[key] = Buffer.from(json[key].data);
        }
        else if (json[key] && typeof(json[key]) === 'object' && Object.keys(json[key]).length) {
            json[key] = deserializeBuffer(json[key]);
        }
    });

    return json;
};

export const jsBinary = {

    packet: {

        encode: (data: PacketInterface): Buffer => {
            const binPacket = Buffer.from(JSON.stringify(data));
            const packet = Buffer.concat([Buffer.alloc(4), binPacket]);
            packet.writeUInt32BE(binPacket.length + 4, 0);

            return packet;
        },
        decode: (data: Buffer): PacketInterface => {
            return deserializeBuffer(JSON.parse(data.toString()));
        }

    }

};