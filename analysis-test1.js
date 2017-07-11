/**
 * Created by wangqi on 2017/7/9.
 */
import {Wechaty, Room, MediaMessage, Config, Message, Contact} from 'wechaty';
import {createWriteStream, writeFileSync}  from 'fs'

const bot = Wechaty.instance();
const db = require('./db');
var sleep = require('sleep');
var express = require('express');
var app = express();
const phantom = require('phantom');
global.Promise = require('bluebird');
var topic='';

app.use('/dist', express.static(__dirname + '/public'));
var list = [];
app.set('port', process.env.port || 3000);
app.listen(app.get('port'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "analysis.html");
    console.log('open page')
});

/*-------返回用户活跃度列表--------------*/
app.get('/pic', function (req, res) {

    console.log(app+'topic');

    var date1=new Date();
    var date2=new Date(date1-1000*3600*24*7);

    /*------按照群名及时间段(一周)查询-------*/
    db.Msg.find({topic:topic})
        .find({"$and":[{"created":{"$gt":date2}},{"created":{"$lt":date1}}]}, function (err, result) {  //查找该群名下的所有聊天记录
            var list=[];
            console.log(result);
            result.forEach((msg)=> {
                "use strict";
            // room=msg.room;
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

           // console.log(list);

            var list=Jsonsort(list, 'counts');  //按留言数从高到低排序

            var data = {
                result: true,
                datum: list
            }

            console.log(data)
            res.send(data);
        })

});

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
    // console.log(contact)
    const content = m.content();
    const room = m.room();
    console.log(contact.alias());


    // if (m.self()) return;
    if (room) {
        console.log(`Room:${room.topic()}、${contact}发来${content}`);

        /*存头像到本地*/
        const avatarFileName = `${contact.name()}.jpg`
        const avatarReadStream = await contact.avatar()
        const avatarWriteStream = createWriteStream('./public/' + avatarFileName)
        avatarReadStream.pipe(avatarWriteStream)

        /*存下每个人的话*/
        saveMsg(m);

    } else {
        console.log(`${contact}:${content}`)
    }

})
.init()

/*--------调用方法 设置循环时间以及群名------------------*/

//setInterval(roomAnalyze, 1000 * 20, "啦啦啦");
setTimeout(roomAnalyze, 1000 * 10, "益寿堂")
setTimeout(roomAnalyze, 1000 * 20, "啦啦啦")

/*---------存消息-----------*/
function saveMsg(m) {
    let img = '';
    let contact = m.from();

    let obj = {
        name: m.from(),
        topic: m.room().topic(),
        img: `${contact.name()}.jpg`,
        msg: m.content(),
        created: new Date()
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

/*-------分析群成员活跃度-------------*/
function roomAnalyze(topics) {
    topic=topics;

    console.log("function "+topic);

    Room.find({topic: topics})
        .then(room => {
        // console.log(room);
        if (room) {
            /*------截屏----------*/
            setTimeout(function () {

                (async function () {
                    const instance = await phantom.create();
                    const page = await instance.createPage();

                    await page.property('viewportSize', {width: 375, height: 667});
                    const status = await page.open('http://192.168.1.119:3000/');
                    console.log(`Page opened with status [${status}].`);

                    await sleep.sleep(3);  //延时三秒
                    await page.render('chat '+topic+'.jpg');
                    console.log(`File created at [./chat.jpg]`);

                    // room.say("http://192.168.1.119:3000/");
                    // room.say(new MediaMessage('chat '+topic+'.jpg'))

                    await instance.exit();
                }());

            }, 2000);

        }

    })
}

function Jsonsort(data, key) {
    var tmp=null;

    for (var j = 0; j < data.length - 1; j++) {

        for (var i = 0; i < data.length-j-1; i++) {

            if (data[i][key] < data[i+1][key]) {

                tmp = data[i];
                data[i] = data[i+1];
                data[i+1] = tmp;
            }
        }
    }
    return data;
}

/*------清除数据库-----*/
function cleanData() {

}




