var Marquee=function(el,nexttime,cycle,ClassName){
    this.el=$(el);
    this.childs=this.el.find('.marquee_in_say');
    this.childs_count=this.el.find('.marquee_in_say').length-1;  
    this.cycle=cycle;
    this.WinSize=$(window).width();
    this.times=nexttime;
    this.nowNumber=0;
    this.lastNumber=this.childs_count;
    this.className=ClassName;
  }
  Marquee.prototype.start = function () {    
    this.childs_count=this.el.find('.marquee_in_say').length-1;//--重新抓DOM 不燃append的子元素 會抓不到
    this.childs=this.el.find('.marquee_in_say');//--重新抓DOM 不燃append的子元素 會抓不到
    var tt=this.times/1000+'s';
    //console.log(this.childs_count+1);
    //console.log(this.nowNumber);
    
    this.childs.eq(this.lastNumber).removeClass(this.className);
    this.childs.eq(this.nowNumber).addClass(this.className);
    this.lastNumber=this.nowNumber;
    if(this.nowNumber<this.childs_count){    
      this.nowNumber++;      
    }else if(this.cycle){//--循環播放
      this.nowNumber=0;        
    }else if(this.cycle==false){//--NO循環播放
      this.nowNumber=this.nowNumber;
    }  
    setTimeout(Marquee.prototype.start.bind(this),this.times);
  }
  
  Marquee.prototype.start_remove = function () {//--只跑一次 刪除dom 
    this.childs_count=this.el.find('.marquee_in_say').length;
    //console.log(this.childs_count);  
    this.childs=this.el.find('.marquee_in_say');//--重新抓DOM 不燃append的子元素 會抓不到
    if(this.childs_count>0){//--如果 子元素不為0
      this.childs.eq(0).addClass(this.className).delay(this.times).queue(function() {    
      $(this).remove();        
    });  
    }  
    setTimeout(Marquee.prototype.start_remove.bind(this),this.times+100);
  }
  
  
  $('#app').on('click',function(){
      $('#do1').append(
      //`<span class='marquee_in_say addanimation'>new new new</span>`
        `<span class='marquee_in_say'>new new new</span>`
      );
      //var nnb=$('#do1').find('.marquee_in_say').length;    
  });
  var a=new Marquee('#marqueeTeach',8000,true,'addanimationTeach');//--#do1 不要用 $('#do1')
  //a.start();
  a.start_remove();//--不可循環 跑完即刪除DOM