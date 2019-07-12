//console.log("ads");
var Scrolls_opa=function(el){
    this.el=el;
    this.nb=this.el.children('.sc_con').length;  
    this.el.children('.sc_con:eq(0)').css({
      'display':'block',
      'opacity':1
    });
    for(i=0;i<this.nb;i++){        
      if(i==0){
        var sets=$('<span class="sc_dot active"></span>');
        this.el.children('.dot_out').append(sets);
        sets.click(Do_opacity);
      }else{
        var sets=$('<span class="sc_dot"></span>');
        this.el.children('.dot_out').append(sets);
        sets.click(Do_opacity);
      }
    }
  }
  function Do_opacity(){
    //console.log('CC');
    $(this).addClass('active').siblings('.sc_dot').removeClass('active');
    var ctn=$(this).parent('.dot_out').find('span').index(this);
    var obj=$(this).closest(".back_opacity").children(`.sc_con:eq(${ctn})`); 
    obj.css('display','block').animate({
      'opacity':1
    },300).siblings('.sc_con').animate({
      'opacity':0,    
    },300).css('display','none');
  }
  
  var Scrolls_move=function(el,stg){
    this.el=el;
    this.stage=stg;
    this.nb=this.el.find('.back_run').children('.sc_con').length;  
    var myW=this.el.innerWidth();
    var myH=this.el.innerHeight();
    if(this.stage=='X'){
      this.el.find('.back_run').children('.sc_con').css('width',myW+'px');  
    }else if(this.stage=='Y'){
      this.el.find('.back_run').children('.sc_con').css('height',myH+'px');  
    }
    
    for(i=0;i<this.nb;i++){        
      if(i==0){
        var sets=$('<span class="sc_dot active"></span>');
        this.el.children('.dot_out').append(sets);      
        if(this.stage=='X'){sets.click(Do_moveX);}
        else if(this.stage=='Y'){sets.click(Do_moveY);}
      }else{
        var sets=$('<span class="sc_dot"></span>');
        this.el.children('.dot_out').append(sets);
        if(this.stage=='X'){sets.click(Do_moveX);}
        else if(this.stage=='Y'){sets.click(Do_moveY);}
      }
    }
  }
  function Do_moveX(){
    $(this).addClass('active').siblings('.sc_dot').removeClass('active');
    var ctn=$(this).parent('.dot_out').find('span').index(this);  
    var obj=$(this).closest('.back_moveX');
    var WD=obj.innerWidth();
    var Fw=WD*ctn*-1;
    var Mobj=obj.find('.back_run');
    Mobj.animate({
      'left':Fw+'px'
    },500);
  }
  function Do_moveY(){
    $(this).addClass('active').siblings('.sc_dot').removeClass('active');
    var ctn=$(this).parent('.dot_out').find('span').index(this);  
    var obj=$(this).closest('.back_moveY');
    var WD=obj.innerHeight();
    var Fw=WD*ctn*-1;
    var Mobj=obj.find('.back_run');
    Mobj.animate({
      'top':Fw+'px'
    },500);
  }
//   var t1=new Scrolls_opa($('#back_opa'));
//   var t2=new Scrolls_move($('#back_mX'),'X');
//   var t3=new Scrolls_move($('#back_mY'),'Y');