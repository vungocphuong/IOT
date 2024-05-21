/*
Welcome to JP Learning
*/
const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;
const EventsSchema = new Schema({
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
    temperature: {
        type: Number,
        required: true
    },
    humidity: {
        type: Number,
        required: true
    },
    lightsensor: {
        type: Number,
        required: true
    },
    dustsensor: {
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
    }
);

module.exports = mongoose.model('Events', EventsSchema);