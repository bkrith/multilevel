
'use strict';

import { PacketInterface } from './interfaces';

const deserializeBuffer = (json: any): any => {
    if (json !== undefined) {
        if (json.type && json.data && json.type === 'Buffer') {
            json = Buffer.from(json.data);
        }
        else if (json.type && json.data && json.type === 'bigint') {
            json = BigInt(json.data);
        }
        else {
            Object.keys(json).forEach((key) => {
                if (json[key] !== undefined) {
                    if (json[key].type && json[key].type === 'Buffer') {
                        json[key] = Buffer.from(json[key].data);
                    }
                    else if (json[key].type && json[key].type === 'bigint') {
                        json[key] = BigInt(json[key].data);
                    }
                    else if (typeof (json[key]) === 'object' && Object.keys(json[key]).length) {
                        json[key] = deserializeBuffer(json[key]);
                    }
                }
            });
        }
    }

    return json;
};

export const binary = {

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