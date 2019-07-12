var questions=[
    ["美國的首都是?","紐約","洛杉磯","華盛頓","芝加哥","3"],//--題目 選擇1 選擇2 選擇3 選擇4 答案
    ["澳洲的首都是?","伯斯","坎培拉","墨爾本","雪梨","2"],
    ["土耳其的首都是？","安塔莉亞","伊斯坦堡","安卡拉","布達佩斯","3"],
    ["瑞士的首都是？","伯恩","蘇黎世","洛桑","日內瓦","1"],
    ["越南的首都是？","清邁","胡志明市","芽莊市","河內市","4"],
    ["荷蘭的首都是？","鹿特丹","恩荷芬","霍芬海姆","阿姆斯特丹","4"],
    ["下列何者在二戰時與其他國家不是同一陣線?","英國","義大利","法國","美國","2"],
    ["3+5X3+8-7=?","19","25","21","17","1"],
    ["3的5次方=?","15","81","243","729","3"],
    ["下列何者體重最重?","2014年的連勝文","館長-陳之漢","2019年的連勝文","林書豪","2"],
];
var Login=false;
var pushedID=[];//--myID(順序),MyDomId(APD順序/DOM id),Mynames(遊戲匿名),Myscore(分數)
var msgs;
var MyDomId="";
var myID;//--編號 ID
var Mynames="";
var Myscore=0;//--天梯積分
//--關卡Data(要重製)
var Qstage=0;//--題目階段
var Qnumbers;//--亂數題目代號
var Iplaying=false;
var MyEnermyLongID='';//--亂碼長ID
var MyEnermyScore=0;//--敵人這個關卡分數
var HasANS=false;//---選擇答案
var ChooseNB=0;//--我選擇第幾個答案
var MyNowScore=0;//--我這個關卡分數
var CanChoose=true;//--可以選擇答案
var Chstage=0;//--2個人作答的狀態  0:都沒提交  1:1個人提交 2:2人
var times=15.0;//--作答時間 秒
var TheInterval;//--計時器
//--關卡Data(要重製)
$(document).ready(function(){
    var socket= io();  
        socket.on("Namefalse",function(){
            alert("此名子已使用");
        });
        socket.on("NameTrue",function(msg){//--成功使用name登入
            
            $("#PlayerAll .container tbody").append(
                            //`<p class="myBar" id="${MyDomId}"><span>名字:${Mynames}</span><span class"scs">分數:${Myscore}</span></p>`
                            `<tr class="myBar" id="${MyDomId}"><td>${Mynames}</td><td class"scs">${Myscore}</td><td>0</td></tr>`
                        );
            pushedID.push([myID,MyDomId,Mynames,Myscore]);
            $("#Login").css("display","none");
            $("#Loged #names span").text(Mynames);
            $("#Loged #scores span").text(Myscore);
            $("#Loged").css("display","block");
        });      
        socket.on("newclientconnect",function(msg){
            Login=true;
            myID=msg.id;
            MyDomId="APD"+myID;
        });
        socket.on("checkdatas",function(msg){//--檢查所有人的資料
            //console.log(msg);
            for(var i=0;i<msg.length;i++){
                var have=false;
                if(msg[i]==null){continue;}//--跳過這個i 去執行下一個i值的迴圈
                for(var a=0;a<pushedID.length;a++){
                    if(msg[i][0]==pushedID[a][0]){//--如果 已經append好 改x,y
                        //var oj=document.getElementById(pushedID[a][1]);
                        var oj="#"+pushedID[a][1];
                        $(oj).children("td").eq(1).html(msg[i][2]);
                        pushedID[a][3]=msg[i][2];//--分數更新
                        have=true;
                    }
                }//--for a END
                if(have==false){//--如果還沒append,append進去
                        var names="APD"+msg[i][0];//--APD+數字
                        var ct2=msg[i][1];
                        var ct3=msg[i][2];
                        $("#PlayerAll .container tbody").append(
                            //`<p id="${names}"><span>名字:${ct2}</span><span class"scs">分數:${ct3}</span></p>`
                            `<tr id="${names}"><td>${ct2}</td><td class"scs">${ct3}</td><td>0</td></tr>`
                        );
                        pushedID.push([msg[i][0],names,msg[i][1],msg[i][2]]);
                }
            }//--for i END
        });
        socket.on("deleteP",function(msg){//--刪除離線的人 的DOM
            var iid=msg.ids+1;
            var DD="APD"+iid;
            console.log("DELL");
            $('#'+DD).remove();
            //console.log(pushedID[msg.ids]);                
        });
        
        socket.on("GameStart",function(msg){//--配對成功 開始遊戲
            console.log(msg.nb);
            //console.log(pushedID);
            GStart(msg);
            Question(msg.nb);
        });
        socket.on("EnermyANS",function(msg){//--傳來 對手選擇的答案
            Chstage=msg.STG;
            if(msg.ANS>0&&msg.ANS<5)$("#QUS .choose").eq(msg.ANS-1).addClass("EnermyChoose");                
            if(msg.STG==2&&ChooseNB!=0){ CheckANS();console.log("Class1");}//--公布答案&下一提 (不同時 案送出)
            if(msg.STG==1&&CanChoose==false){ CheckANS();console.log("Class2");}//--公布答案&下一提(同時 案送出)
        });
        socket.on("EnermySCS",function(msg){//--傳來 對手此局分數
            $("#EnGameSC").text("本場分數:"+msg.Alls);
            MyEnermyScore=msg.Alls;
            setTimeout(TimeDataReset,2000);
        });
        socket.on("EnermyOut",function(){//--對戰中 對手離開
            if(Iplaying)MyEnOutGame();
        });
        
    $("#Login button").on( "click", function() {//--確認名字 送出
        var values=$("#Login Input").val();
        Mynames=values;
        console.log(values);
        socket.emit('Checkname',{id:myID,name:values,score:Myscore,playstage:Iplaying});
        //socket.emit('Checkname',{name:values,score:Myscore,playstage:Iplaying});
    });
    
    $("#Loged button").on( "click", function() {//---開始配對
        $("#Playing").css('display','block');
        socket.emit('Findplyer',{ids:myID-1});
        //socket.emit('Findplyer',{ids:myID});
        Iplaying=true;
    });
    $("#Searching button").on( "click", function() {//--取消配對
        $("#Playing").css('display','none');
        socket.emit('CancelFind',{ids:myID-1});
        Iplaying=false;
    });
    $("#PlayArea #QUS button").on( "click", function() {//-案確認按鈕(送出答案)
        if(HasANS){//--向伺服器發射 我選擇的答案
            Chstage++;
            socket.emit('PlayerChoosed',{MyEN:MyEnermyLongID,MyANS:ChooseNB,Stg:Chstage});
            HasANS=false;
            CanChoose=false;//--禁止作答
            clearInterval(TheInterval);
            if(Chstage==2){CheckANS();}//--公布答案&下一提(2邊都提交)                                  
            $("#PlayArea #QUS button").css('display','none');
        }
        else{alert("未選擇答案");}
    });
    $("#QUS .choose").on("click",function(){//--選擇題目
        if(CanChoose){
            $(this).addClass("clicked").siblings("p").removeClass("clicked");
            //console.log($("#QUS span").index(this));
            ChooseNB=$("#QUS p").index(this);
            HasANS=true;
        }
    });
    $("#Closebtn").on("click",function(){//--關閉 結算UI(完成並離開對戰)
        $("#Finished").animate({opacity:0},500,function(){$("#Finished").css('display','none');});
        CloseGameResetData();
    });
    function GStart(is){//--遊戲開始  載入對手資料,開啟UI
        $("#Searching").css('display','none');
        $("#PlayArea").css('display','block');
        $("#Pmyself  p:nth-child(1)").text(Mynames);
        $("#Pmyself  p:nth-child(2)").text("天梯積分:"+Myscore);
        $("#MyGameSC").text("本場分數:0");
        $("#EnGameSC").text("本場分數:0");
        for(var i=0;i<pushedID.length;i++){
            if(is.ids==pushedID[i][0]){
                $("#Pother p:nth-child(1)").text(pushedID[i][2]);
                $("#Pother p:nth-child(2)").text("天梯積分:"+pushedID[i][3]);
                MyEnermyLongID=is.longid;//--對手的長ID
                break;
            }
        }
                    
    }
    function Question(nbs){//--遊戲問題 載入
        Qnumbers=nbs;
        $("#QUS p:nth-child(1)").text("第"+(Qstage+1)+"題:"+questions[nbs[Qstage]][0]);
        $("#QUS p:nth-child(3)").children("span:nth-child(2)").text(questions[nbs[Qstage]][1]);
        $("#QUS p:nth-child(4)").children("span:nth-child(2)").text(questions[nbs[Qstage]][2]);
        $("#QUS p:nth-child(5)").children("span:nth-child(2)").text(questions[nbs[Qstage]][3]);
        $("#QUS p:nth-child(6)").children("span:nth-child(2)").text(questions[nbs[Qstage]][4]);
        TheInterval=setInterval(InterTimes,1000);
    }
    function CheckANS(){//--判斷選擇送出
        $("#QUS p").eq(questions[Qnumbers[Qstage]][5]).addClass("TrueANS").siblings(".choose").addClass("FalseANS");
        GetThisRecord();
    }
    function InterTimes(){//-作答計時器fuc
        if(times>0){
            times=times-1;
            document.title='剩餘作答:'+times;
            times=times.toFixed(1);
            $("#ANStime").text("作答時間:"+times+"s");                
        }            
        if(times<=0&&CanChoose){//--時間到
            Chstage=2;
            socket.emit('PlayerChoosed',{MyEN:MyEnermyLongID,MyANS:0,Stg:Chstage});
            HasANS=false;
            CanChoose=false;//--禁止作答                                                  
            $("#PlayArea #QUS button").css('display','none');                
            CheckANS();
            clearInterval(TheInterval);    
        }//--超過時間未作答
    }
    function GetThisRecord(){//--結算本關成績
        clearInterval(TheInterval);
        var scs=0;
            //console.log(times);
        if(ChooseNB==questions[Qnumbers[Qstage]][5]){//-答對
            scs=Math.ceil(times);
           // console.log(scs);
            MyNowScore=MyNowScore+scs;
        }else{//--答錯
            scs=0;
            MyNowScore=MyNowScore+0;
        }
        //console.log(MyNowScore);
        $("#MyGameSC").text("本場分數:"+MyNowScore);
        socket.emit('MyScoreToEnermy',{MyEN:MyEnermyLongID,PlusSC:scs,AllSC:MyNowScore});//--傳我這局的成績給敵人
    }
    function TimeDataReset(){//--關閉計時器+重設參數       
        $("#PlayArea #QUS button").css('display','inline-block');
        $("#QUS .choose").removeClass("clicked");
        $("#QUS p").removeClass("TrueANS").removeClass("FalseANS");
        $("#QUS .choose").removeClass("EnermyChoose");
        if(Qstage<4){//--進行下一提
            Qstage++;
            times=15.0;
            HasANS=false;
            ChooseNB=0;
            CanChoose=true;
            Chstage=0;
            Question(Qnumbers);
        }
        else{//--完成所有題目
            var Fstage="";
            var Fplus=0;
            console.log(MyNowScore);
            console.log(MyEnermyScore);
            if(MyNowScore>MyEnermyScore){//--贏
                Myscore=Myscore+MyNowScore+50;
                Fstage="獲勝";
                Fplus=MyNowScore+50;
            }else if(MyNowScore<MyEnermyScore){//--輸
                Myscore=Myscore+MyNowScore;
                Fstage="落敗";
                Fplus=MyNowScore;
            }else{//-平手
                Myscore=Myscore+MyNowScore+25;
                Fstage="平手";
                Fplus=MyNowScore+25;
            }
            $("#Panels .Content .Result").text(Fstage);
            $("#Panels .Content .GetPoints").text("天梯積分+"+Fplus);
            $("#Finished").css('display','block').animate({opacity:1},500);       
            //socket.emit('SuccessGame',{id:myID-1,Scores:Myscore});//--傳我這局的成績給敵人   3/11 DownHere
        }
    }
    function CloseGameResetData(){//---離開遊戲房間(重製Data)
         Qstage=0;//--題目階段
         Qnumbers=[];//--亂數題目代號
         Iplaying=false;
         MyEnermyLongID='';//--亂碼長ID
         MyEnermyScore=0;//--敵人這個關卡分數 
         HasANS=false;//---選擇答案
         ChooseNB=0;//--我選擇第幾個答案
         MyNowScore=0;//--我這個關卡分數
         CanChoose=true;//--可以選擇答案
         Chstage=0;//--2個人作答的狀態  0:都沒提交  1:1個人提交 2:2人
         times=15.0;//--作答時間 秒
         $("#Searching").css('display','block');
         $("#PlayArea").css('display','none');
         $("#Playing").css('display','none');
         socket.emit('CancelFind',{ids:myID-1});
         socket.emit('UpdateMyScore',{ids:myID,newSC:Myscore});
         console.log(pushedID);
         Iplaying=false;
         $("#Loged #scores span").text(Myscore);//--更新首頁自己的分數
    }
    function MyEnOutGame(){//--對手中離
        $("#PlayArea #QUS button").css('display','inline-block');
        $("#QUS .choose").removeClass("clicked");
        $("#QUS p").removeClass("TrueANS").removeClass("FalseANS");
        $("#QUS .choose").removeClass("EnermyChoose");
        CloseGameResetData();
        clearInterval(TheInterval);
        $("#Panels .Content .Result").text('獲勝:對手離開');
        Myscore=Myscore+MyNowScore+50;
        var insay=MyNowScore+50;
        $("#Panels .Content .GetPoints").text("天梯積分+"+insay);
        $("#Finished").css('display','block').animate({opacity:1},500);       
    }

    $('#For_rank').on('click',Ranking_sort);

    function Ranking_sort(){//--<td>所有資料排名
        var R_allnb=$("#PlayerAll .container tbody tr").length;
        var Datas=[];            
        for(i=0;i<R_allnb;i++){
            var vv=$("#PlayerAll .container tbody tr").eq(i);
            var vv2=vv.children('td:nth-child(2)').html();
            var vvv=[vv,vv2];
            Datas.push(vvv);
            //console.log('RR:'+vv2);
        }
        Datas.sort(function (a, b) {//--小到最大
            return a[1] - b[1];
        });
        Ranking_do(Datas);            
    }
    function Ranking_do(data){//--Dom畫面排名更動
        for(i=0;i<data.length;i++){                
            var a=$("#PlayerAll .container tbody tr").eq(i);               
            var s=data.length-(i+1);
            data[s][0].insertBefore(a);//--data移動到a(DOM)之前
            data[s][0].children('td:last-child').html(i+1);
        }
    }

});