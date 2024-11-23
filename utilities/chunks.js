/**********************************************************************************
** ****************************************************************************** *
// THIS CONTAIN MY FUNCTIONS I CREATE TO HELP MY WORK AND MAKE MY LIFE EASY 😁💭//
** ****************************************************************************** *
*********************************************************************************/
// OTHERS EXPORTS
const ObjectId = require('mongodb').ObjectId

// MINE
const chunks = {};

// A Function that extends the ObjectId function
chunks.isValidObjectId = (id, logType=false, logErr=false) => {
    // check for a 24-character hex string
    if (typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)) {
        if (logType) {
            console.log({ id_type:'24HexString' });
        }
        return '24HexString';
    }

    // check for a 12-byte Uint8Array
    if (id instanceof Uint16Array && id.length === 12) {
        if (logType) {
            console.log({ id_type:'12Uint16Array' });
        }
        return '12Uint16Array';
    }

    // check for an integer
    // try to convert the number to an integer and check if the string id is all strictly a number
    try {
        if (Number.isInteger(parseInt(id)) && Number(id)) {
            if (logType) {
                console.log({ id_type:'integer'} );
            }
            return 'integer';
        }
    } catch (err) {
        if (logErr) {
            console.error({ error: err });
        }
    }

    // check for string values
    if (typeof id === 'string') {
        if (logType) {
            console.log({ id_type:'string' })
        }
        return 'string';
    }

    if (logType) {
        console.log('invalid id (id is not a 24-character hex string, or a 12-byte Uint8Array, an Integer, or a string)');
    }
    return false;  // Invalid id if none of the conditions are met
}

// A Function that extends the ObjectId function (it check and return only valid object id)
chunks.validObjectId = (id, logType=false, logErr=false) => {
    // check for a 24-character hex string
    if (typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)) {
        if (logType) {
            console.log({ id_type:'24-character hex string' });
        }
        return new ObjectId(id);
    }

    // check for a 12-byte Uint8Array
    if (id instanceof Uint16Array && id.length === 12) {
        if (logType) {
            console.log({ id_type:'12-byte Uint8Array' });
        }
        return new ObjectId(id);
    }

    // check for an integer
    // try to convert the number to an integer and check if the string id is all strictly a number
    try {
        if (Number.isInteger(parseInt(id)) && Number(id)) {
            if (logType) {
                console.log({ id_ype:'Integer' });
            }
            return parseInt(id);
        }
    } catch (err) {
        if (logErr) {
            console.error({ error: err });
        }
    }

    // check for string values
    if (typeof id === 'string') {
        if (logType) {
            console.log({ id_type:'string' })
        }
        return id;
    }

    throw new Error({ id_type_error: 'invalid id (id must be a 24-character hex string, or a 12-byte Uint8Array, an Integer or a string)' });  // Invalid id if none of the conditions are met
}

module.exports = chunks;