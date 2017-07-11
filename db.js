/**
 * Created by wangqi on 2017/7/9.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = require('bluebird')

const MsgSchema = new Schema({
    name: {type: String},
    topic:{type:String},
    img:{type:String},
    msg: {type: String},
    created: {type: Date}
});

const Model = {
    Msg: mongoose.model('Msg', MsgSchema),
}

const dbHost = 'mongodb://localhost:27017/roomMsg';
mongoose.connect(dbHost);
const db = mongoose.connection;

db.on('error', function () {
    console.log('Database connection error.');
})
db.once('open', function () {
    console.log('The Database has connected.')
})

module.exports = Model;
