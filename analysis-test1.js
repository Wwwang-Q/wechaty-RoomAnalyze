/**
 * Created by wangqi on 2017/7/9.
 */
import {Wechaty, Room,MediaMessage, Config, Message, Contact} from 'wechaty';
import {createWriteStream, writeFileSync}  from 'fs'

const bot = Wechaty.instance();
const db = require('./db');
var express = require('express');
var app = express();
const phantom = require('phantom');

//app.use(express.static('public'));
app.use('/dist', express.static(__dirname + '/public'));
var list = [];
app.set('port', process.env.port || 3000);
app.listen(app.get('port'));

bot
    .on('scan', (url, code)=> {
        let loginUrl = url.replace('qrcode', 'l')
        require('qrcode-terminal').generate(loginUrl)
        console.log(url)
    })

    .on('login', user => console.log(`User ${user} logined`))
    .on('message', async function (m) {
        //console.log(m);
        const contact = m.from();
        console.log(contact)
        const content = m.content();
        const room = m.room();
        console.log(contact.alias());
        console.log(contact.avatar());

        if (m.self()) return;
        if (room) {
            console.log(`Room:${room.topic()}、${contact}发来${content}`);
            /*存下每个人的话*/
            saveMsg(m);
        } else {
            console.log(`${contact}:${content}`)
        }

    })
    .init()

setTimeout(roomAnalyze, 1000 * 20, "益寿堂");   //在此处指定要分析的群名

function saveMsg(m) {
    let img = '';
    let contact = m.from();
    // const avatarFileName = `${contact.name()}.jpg`
    // const avatarReadStream =  contact.avatar();
    // const avatarWriteStream = createWriteStream(avatarFileName)
    // avatarReadStream.pipe(avatarWriteStream)

    let obj = {
        name: m.from(),
        room: m,
        topic:m.room().topic(),
        img: img,
        msg: m.content()
    }
    let msg = new db.Msg(obj);
    //console.log(msg);
    msg.save(function (err, result) {
        if (err) {
            console.log('save room message error!')
        } else {
            console.log('save room message successfully!')
        }
    })
}

function roomAnalyze(topic) {
    var list = [];
let room='';
    db.Msg.find({topic: topic}, function (err, result) {  //查找该群名下的所有聊天记录
        // console.log(result);
        result.forEach((msg)=> {
            "use strict";
            room=msg.room;
            let name = msg.name;
            let img = msg.img;
            for (var i = 0; i < list.length; i++) {
                if (name === list[i].name) {
                    list[i].counts++;
                    return;
                }
            }
            list.push({name: name, counts: 1, img: img})
        })
//console.log(list);
        Jsonsort(list, 'counts');  //按留言数从高到低排序

        console.log(list);
    })

    /*------------*/

    app.get('/', function (req, res) {
        res.sendFile(__dirname + "/" + "analysis.html");

    });
    app.get('/pic', function (req, res) {
        var data = {
            result: true,
            datum: list
        }
        console.log(data)
        res.send(data);
    });

    /*------截屏----------*/
    setTimeout(function () {

        (async function () {
            const instance = await phantom.create();
            const page = await instance.createPage();

            await page.property('viewportSize', {width: 375, height: 667});
            const status = await page.open('http://localhost:3000');
            console.log(`Page opened with status [${status}].`);

            await page.render('chat.jpg');
            console.log(`File created at [./chat.jpg]`);
            // croom.say(new MediaMessage('chat.jpg'))

            await instance.exit();
        }());

    }, 5000);

    Room.find({ topic:topic} )
        .then(room =>{
           // console.log(room);
            if(room){
                room.say("http://localhost:3000");
                room.say(new MediaMessage('chat.jpg'))
            }

        })
}

function Jsonsort(data, key) {
    for (var j = 0; j < data.length - 1; j++) {
        var tmp = data[j];
        var val = tmp[key];

        for (var i = j + 1; i < data.length; i++) {
            if (data[i][key] > val) {
                data[j] = data[i];
                data[i] = tmp;
            }
        }
    }
}
/*------清除数据库-----*/
function cleanData() {

}




