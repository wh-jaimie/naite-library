// 나이테 공통 '📤 공유' 버튼 — 페이지 위쪽(header.top)에 넣고, 없으면 오른쪽 위에 떠 있는 버튼으로.
// 모바일은 공유시트(카톡·인스타 등), 아니면 링크 복사. 나이테 120·국내 인기 책장은 자체 버튼이 있어 건너뜀.
(function(){
  if(document.getElementById('prLink')||document.getElementById('shareBtn'))return;
  if(/[?&]embed=/.test(location.search))return; // 기록 앱 안에서는 숨김
  var css='.nt-share{border:0;background:linear-gradient(135deg,#B87343,#D1965C);color:#fff;font:inherit;font-family:"Noto Sans KR",system-ui,sans-serif;font-weight:800;font-size:.85rem;padding:9px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;box-shadow:0 1px 2px rgba(43,42,38,.08),0 6px 16px rgba(43,42,38,.14);flex:0 0 auto;line-height:1.2}'+
    '.nt-share.in-top{margin-left:auto}.nt-share.in-top+.back,.back+.nt-share.in-top{margin-left:8px}'+
    '.nt-share.float{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:12px;z-index:60}'+
    'header.top .back{white-space:nowrap;flex:0 0 auto}header.top .brand{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1 1 auto}'+
    '@media (max-width:420px){.nt-share{padding:8px 11px;font-size:.8rem}header.top .back{padding:7px 10px}}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  var b=document.createElement('button');b.type='button';b.className='nt-share';b.textContent='📤 공유';b.title='이 페이지 공유하기';
  var top=document.querySelector('header.top'),host=top&&(top.querySelector('.wrap')||top);
  if(host){
    var back=host.querySelector('.back');
    b.classList.add('in-top');
    if(back){back.style.marginLeft='auto';b.style.marginLeft='8px';host.insertBefore(b,back.nextSibling);}
    else{host.style.display=host.style.display||'';host.appendChild(b);var cs=getComputedStyle(host);if(cs.display!=='flex'){host.style.display='flex';host.style.alignItems='center';host.style.gap=host.style.gap||'8px';}}
  }else{b.classList.add('float');document.body.appendChild(b);}
  function url(){var u=new URL(location.href);['notrack','embed','from'].forEach(function(k){u.searchParams.delete(k);});u.hash='';return u.toString();}
  function desc(){var m=document.querySelector('meta[name="description"]');return m?m.getAttribute('content'):'파닉스 전, 아이 첫 영어 그림책 · 나이테';}
  b.addEventListener('click',function(){
    var u=url(),t=document.title||'나이테';
    if(navigator.share){navigator.share({title:t,text:desc(),url:u}).catch(function(){});return;}
    function done(){b.textContent='✓ 링크 복사됨';clearTimeout(b._t);b._t=setTimeout(function(){b.textContent='📤 공유';},1600);}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(done,done);
    else{try{var ta=document.createElement('textarea');ta.value=u;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}catch(_){}done();}
  });
})();
