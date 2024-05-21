const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const moment = require('moment');

const Schema = mongoose.Schema;

const ActionsSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    device_id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    created: {
        type: Date,
        default: moment().utc().add(7, 'hours')
    },
    stt:{
        type: Number,
        required: true
    }
}, {
    _id: false,
    id: false,
    versionKey: false,
    strict: false
});

module.exports = mongoose.model('Actions', ActionsSchema);