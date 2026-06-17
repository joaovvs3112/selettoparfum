(function(){
  // Meta Pixel — Contact event em qualquer clique em link do WhatsApp
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href*="chat.whatsapp.com"]');
    if(a&&typeof fbq==='function'){fbq('track','Contact')}
  },{passive:true});

  // Fade-up observer
  var fadeObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible')});
  },{threshold:0.15});
  document.querySelectorAll('.fade-up').forEach(function(el){fadeObs.observe(el)});

  // Vagas bar animation
  var barObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){document.getElementById('vagasBar').classList.add('animated');barObs.unobserve(e.target)}
    });
  },{threshold:0.5});
  var vb=document.getElementById('vagasBar');
  if(vb)barObs.observe(vb);

  // Video player
  var vid=document.getElementById('heroVideo');
  var playBtn=document.getElementById('heroPlayBtn');
  var progBar=document.getElementById('heroProgress');
  var progFill=document.getElementById('heroProgressFill');
  if(vid&&playBtn){
    playBtn.addEventListener('click',function(){
      vid.play();playBtn.classList.add('hidden');
    });
    vid.addEventListener('pause',function(){
      if(!vid.ended)playBtn.classList.remove('hidden');
    });
    vid.addEventListener('ended',function(){
      playBtn.classList.remove('hidden');
    });
    vid.addEventListener('click',function(){
      if(!vid.paused)vid.pause();
      else{vid.play();playBtn.classList.add('hidden');}
    });
    vid.addEventListener('timeupdate',function(){
      if(vid.duration){progFill.style.width=(vid.currentTime/vid.duration*100)+'%';}
    });
    if(progBar){
      progBar.addEventListener('click',function(e){
        var rect=progBar.getBoundingClientRect();
        var pct=(e.clientX-rect.left)/rect.width;
        vid.currentTime=pct*vid.duration;
      });
    }
  }

  // Floating CTA (mobile only)
  var floating=document.getElementById('floatingCta');
  var hero=document.getElementById('hero');
  var ctaFinal=document.getElementById('cta-final');
  if(floating&&hero&&ctaFinal&&window.innerWidth<=768){
    window.addEventListener('scroll',function(){
      var heroBottom=hero.getBoundingClientRect().bottom;
      var ctaTop=ctaFinal.getBoundingClientRect().top;
      if(heroBottom<0&&ctaTop>window.innerHeight){
        floating.classList.add('active');floating.classList.remove('hidden');
      }else{
        floating.classList.remove('active');floating.classList.add('hidden');
      }
    },{passive:true});
  }

  // Carousel
  var track=document.getElementById('carouselTrack');
  var slides=track?track.querySelectorAll('.carousel-slide'):[];
  var dots=document.querySelectorAll('.carousel-dot');
  var prevBtn=document.getElementById('carouselPrev');
  var nextBtn=document.getElementById('carouselNext');
  if(track&&slides.length){
    var currentSlide=0;
    var isDragging=false;
    var startX=0;
    var startTime=0;
    var currentTranslate=0;
    var prevTranslate=0;

    function getSlideWidth(){
      return slides[0].offsetWidth+16;
    }
    function getMaxTranslate(){
      return -(track.scrollWidth-track.parentElement.offsetWidth+24);
    }
    function setPosition(val,smooth){
      if(smooth!==false)track.classList.remove('grabbing');
      currentTranslate=Math.max(getMaxTranslate(),Math.min(0,val));
      track.style.transform='translateX('+currentTranslate+'px)';
    }
    function goToSlide(n){
      currentSlide=Math.max(0,Math.min(n,slides.length-1));
      var target=-(currentSlide*getSlideWidth());
      target=Math.max(getMaxTranslate(),Math.min(0,target));
      track.classList.remove('grabbing');
      setPosition(target);
      prevTranslate=currentTranslate;
      updateDots();
      updateArrows();
    }
    function updateDots(){
      dots.forEach(function(d,i){d.classList.toggle('active',i===currentSlide)});
    }
    function updateArrows(){
      if(prevBtn)prevBtn.classList.toggle('hidden',currentSlide===0);
      if(nextBtn)nextBtn.classList.toggle('hidden',currentSlide>=slides.length-1);
    }
    function getClosestSlide(){
      var sw=getSlideWidth();
      return Math.round(Math.abs(currentTranslate)/sw);
    }

    // Drag handlers
    function dragStart(x){
      isDragging=true;startX=x;startTime=Date.now();
      track.classList.add('grabbing');prevTranslate=currentTranslate;
    }
    function dragMove(x){
      if(!isDragging)return;
      var diff=x-startX;
      setPosition(prevTranslate+diff);
    }
    function dragEnd(x){
      if(!isDragging)return;
      isDragging=false;track.classList.remove('grabbing');
      var diff=x-startX;var elapsed=Date.now()-startTime;
      var velocity=Math.abs(diff)/elapsed;
      if(Math.abs(diff)>40){
        var jump=velocity>0.8?2:1;
        if(diff<0)goToSlide(currentSlide+jump);
        else goToSlide(currentSlide-jump);
      }else{
        goToSlide(getClosestSlide());
      }
    }

    // Mouse events
    track.addEventListener('mousedown',function(e){e.preventDefault();dragStart(e.clientX)});
    window.addEventListener('mousemove',function(e){if(isDragging){e.preventDefault();dragMove(e.clientX)}});
    window.addEventListener('mouseup',function(e){if(isDragging)dragEnd(e.clientX)});

    // Touch events
    track.addEventListener('touchstart',function(e){dragStart(e.touches[0].clientX)},{passive:true});
    track.addEventListener('touchmove',function(e){dragMove(e.touches[0].clientX)},{passive:true});
    track.addEventListener('touchend',function(e){dragEnd(e.changedTouches[0].clientX)});

    // Prevent image drag
    track.addEventListener('dragstart',function(e){e.preventDefault()});

    // Dots
    dots.forEach(function(dot){
      dot.addEventListener('click',function(){goToSlide(parseInt(this.getAttribute('data-slide')))});
    });

    // Arrows
    if(prevBtn)prevBtn.addEventListener('click',function(){goToSlide(currentSlide-1)});
    if(nextBtn)nextBtn.addEventListener('click',function(){goToSlide(currentSlide+1)});

    updateArrows();
  }
})();
