'use strict';//--ES5嚴謹模式
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 8080;
const INDEX = path.join(__dirname, 'index.html');
const BACK = path.join(__dirname, 'back.html');
var app = express();
/*
const server = app
  .use('/',(req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
*/
app.use(express.static(path.join(__dirname, 'public')));//---html可以引入public的資源(js/css/img..)
app.get('/',(req, res) => res.sendFile(INDEX) );
app.get('/goback',(req, res) => res.sendFile(BACK) );
const server=app.listen(PORT, function () {
    console.log(`Listening on ${ PORT }`);
});
const io = socketIO(server);

var clients=0;
var Players=[];//--id  name  score  playstage
var PlayerWaits=[];//--等待配對中的玩家
var IsGameing=[];//--正在對戰的玩家
var SCids=[];//-- array.length-1   亂數ID
var refuse_play=false;//--玩家能否對戰遊玩
io.on("connection",function(socket){//---socket io監聽 connection  當client/User連線    
    
    socket.emit('newclientconnect',{ description: 'Go to back',refuse_play:refuse_play});//--登入後台
    socket.on("gobacks",function(msg){            
        socket.join('goback');     
    });    
    socket.on("send_msg",function(msg){   
        io.emit("send_msg",{say:msg.say}); 
    });
    socket.on("stop_fight",function(msg){//--開啟/關閉 開放對戰        
        refuse_play=msg.refuse_play;  
        io.emit("stop_fight",{refuse_play:refuse_play}); 
    });

    socket.on("Checkname",function(msg){//--新登入玩家 傳自身id...
        var Has=false;        
        //console.log(Players);
        for(var i=0;i<Players.length;i++){
            if(Players[i]==null){continue;}
            if(msg.name==Players[i][1]){//---玩家ID取名重複
                //socket.broadcast.to(0).emit('Namefalse');
                io.to(socket.id).emit('Namefalse');
                Has=true;
                break;
            }
        }
        if(Has==false){//--成功取名
            clients++;
            var data0=[clients-1,socket.id];
            SCids.push(data0);

            io.to(socket.id).emit('NameTrue',{id:clients});            
            var putin=[clients,msg.name,msg.score,msg.playstage];
            Players.push(putin);
            io.emit("checkdatas",Players);
            io.to('goback').emit('message',{stg:0,name:msg.name});
            console.log(Players);
        }
    });

    socket.on('disconnect', function(){//---如果 client離線/刷新(sever自動偵測,client不用送來)            
        console.log(socket.id);        
        for(var s=0;s<PlayerWaits.length;s++){
            if(PlayerWaits[s]!=null){
                if(PlayerWaits[s][1]==null){continue;}
                else if(PlayerWaits[s][1].includes(socket.id)){
                    delete PlayerWaits[s];                
                }
            }            
        }
        for(var a=0;a<IsGameing.length;a++){//--對戰中直接斷線離開/重整
            if(IsGameing[a]==null){continue;}
            else if(IsGameing[a].includes(socket.id)){
                if(IsGameing[a][0]==socket.id){
                    io.to(IsGameing[a][1]).emit('EnermyOut');
                }
                else if(IsGameing[a][1]==socket.id){
                    io.to(IsGameing[a][0]).emit('EnermyOut');
                }
                delete IsGameing[a];                
            }
        }
        for(var i=0;i<SCids.length;i++){//--大廳中斷線離開/重整
            if(SCids[i][1]==socket.id){
                var sts=SCids[i][0];
                sts=Players[sts][1];//--玩家名字              
                io.to('goback').emit('message',{stg:2,name:sts});
                delete Players[SCids[i][0]];//--刪除 該筆資料
                io.emit("deleteP",{ids:SCids[i][0]});
            }
        }        
        //console.log(Players);
    });

    socket.on('Findplyer', function(msg){//--加入玩家配對 資料
        // console.log(msg);
        // console.log(SCids);
        for(var i=0;i<SCids.length;i++){
            if(msg.ids==SCids[i][0]){
                PlayerWaits.push([msg.ids,SCids[i][1]]);
                break;
            }
        }
        //console.log(PlayerWaits);        
    });
    socket.on('CancelFind', function(msg){//--取消配對
        for(var i=0;i<PlayerWaits.length;i++){
            if(PlayerWaits[i]==null){continue;}
            if(msg.ids==PlayerWaits[i][0]){
                delete PlayerWaits[i];//--刪除 該筆資料
                break;
            }
        }
        //console.log(PlayerWaits);  
    });
    
    socket.on('Offline', function(msg){//--進行遊戲 選擇答案
        io.to(msg.MyEN).emit('Offline',{myid:socket.id});//,{ANS:msg.MyANS,STG:msg.Stg}
    });
    socket.on('PlayerChoosed', function(msg){//--進行遊戲 選擇答案
        io.to(msg.MyEN).emit('EnermyANS',{ANS:msg.MyANS,STG:msg.Stg});
    });
    socket.on('MyScoreToEnermy', function(msg){//--傳給敵人 結算此局分數
        io.to(msg.MyEN).emit('EnermySCS',{Plus:msg.PlusSC,Alls:msg.AllSC});
    });
    socket.on('UpdateMyScore', function(msg){//--完成遊戲 更新分數
        for(var i=0;i<Players.length;i++){
            if(Players[i]==null){continue;}
            if(msg.ids==Players[i][0]){//---玩家ID
                var val=msg.newSC-Players[i][2];
                io.to('goback').emit('message',{stg:1,name:Players[i][1],score:val});
                Players[i][2]=msg.newSC;//--更新玩家分數
                break;
            }
        }
        io.emit("checkdatas",Players);
    });
    var setIn=setInterval(MatchPlayers,100);
    function MatchPlayers(){//--配對玩家        
        var has=[];//--PlayerWaits 非空物件的是哪幾個
        for(var i=0;i<PlayerWaits.length;i++){
            if(PlayerWaits[i]==null){continue;}
            else{has.push([i]);}
        }
        if(has.length>=2){
            //--第一筆 和第二筆 一起配對 --> 然後刪除 --> 再跑一次interval
            var aa=PlayerWaits[has[1]][0]+1;
            var bb=PlayerWaits[has[0]][0]+1;
            var nbs=range(45,5);
            IsGameing.push([PlayerWaits[has[0]][1],PlayerWaits[has[1]][1]]);
            io.to(PlayerWaits[has[0]][1]).emit('GameStart',{ids:aa,longid:PlayerWaits[has[1]][1],nb:nbs});
            io.to(PlayerWaits[has[1]][1]).emit('GameStart',{ids:bb,longid:PlayerWaits[has[0]][1],nb:nbs});
            delete PlayerWaits[has[0]];
            delete PlayerWaits[has[1]];
        }
    }
    function range(allnb,ctn){//--隨機排列 總共allnb個 隨機排列 取前ctn
        //var arr = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44]//,9,10,11,12,13,14];        
        var arr=[];
        for(var a=0;a<allnb;a++){
            arr.push(a);
        }
        var news=[];
        arr.sort(function(){return 0.5-Math.random();}).slice(0,10);
        for(var i=0;i<ctn;i++){
            news.push(arr[i]);
        }
        return news;
        
    }
});
