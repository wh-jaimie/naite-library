/* 나이테 영어도서관 앱 설치(메인 메뉴) — 메인 화면의 '📲 홈 화면에 추가' 버튼용
 * 안드로이드 크롬·삼성 인터넷: 설치 창(beforeinstallprompt) / 아이폰: 공유 → 홈 화면에 추가 안내 /
 * 카카오톡 등 앱 안 브라우저: 크롬·사파리로 열기 안내. 앱(standalone)으로 열려 있으면 버튼 숨김.
 * 사용: <button data-install hidden>…</button> + <script src="/naite-library/pwa-install.js"></script>
 */
(function(){
  var deferred=null;
  function standalone(){try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}}
  function isiOS(){var u=navigator.userAgent;return /iphone|ipad|ipod/i.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1);}
  function inApp(){var u=navigator.userAgent;if(/KAKAOTALK/i.test(u))return '카카오톡';if(/NAVER\(inapp/i.test(u))return '네이버';if(/Instagram/i.test(u))return '인스타그램';if(/FBAN|FBAV/i.test(u))return '페이스북';if(/\bLine\//i.test(u))return '라인';return '';}
  function css(){
    if(document.getElementById('pi-css'))return;
    var s=document.createElement('style');s.id='pi-css';
    s.textContent='.pi-scrim{position:fixed;inset:0;z-index:90;background:rgba(20,26,18,.5);display:flex;align-items:flex-end;justify-content:center}'+
      '.pi-sheet{width:100%;max-width:480px;background:#FCFCF8;color:#23291F;border-radius:22px 22px 0 0;padding:20px 20px calc(24px + env(safe-area-inset-bottom,0px));font-family:inherit}'+
      '.pi-sheet h3{font-family:"Gowun Batang",Georgia,serif;font-size:1.3rem;margin:0 0 8px}'+
      '.pi-sheet p{margin:0 0 10px;color:#565E4E;font-size:.9rem;line-height:1.55}'+
      '.pi-sheet ol{margin:4px 0 6px;padding-left:22px;font-size:.92rem;line-height:1.8}.pi-sheet ol b{color:#245648}'+
      '.pi-sheet a.pi-ext{display:block;text-align:center;margin:8px 0;background:#245648;color:#fff;text-decoration:none;font-weight:800;border-radius:12px;padding:12px}'+
      '.pi-sheet button{width:100%;margin-top:10px;border:0;background:none;color:#565E4E;font:inherit;font-weight:700;padding:8px;cursor:pointer}';
    document.head.appendChild(s);
  }
  function guide(){
    css();
    var app=inApp(),ios=isiOS(),h;
    if(app){var ext=/KAKAOTALK/i.test(navigator.userAgent)?'kakaotalk://web/openExternal?url='+encodeURIComponent(location.href):'';
      h='<h3>📲 홈 화면에 추가</h3><p><b>'+app+' 안에서 열려 있어요.</b> 여기서는 홈 화면에 추가할 수 없어요. '+(ios?'사파리':'크롬')+'에서 열어 주세요.</p>'+
        (ext?'<a class="pi-ext" href="'+ext.replace(/"/g,'&quot;')+'">'+(ios?'사파리로':'크롬으로')+' 열기</a>':'')+
        '<ol><li>화면 위나 아래의 <b>⋮ / ⋯</b> 버튼을 눌러요</li><li><b>다른 브라우저로 열기</b>를 골라요</li><li>열린 화면에서 다시 홈 화면에 추가해요</li></ol>';}
    else if(ios)h='<h3>📲 홈 화면에 추가</h3><p>아이폰은 사파리에서 직접 추가해요.</p><ol><li>화면 아래 <b>공유 버튼(⬆︎)</b>을 눌러요</li><li>목록을 내려 <b>홈 화면에 추가</b>를 골라요</li><li>오른쪽 위 <b>추가</b>를 누르면 끝!</li></ol>';
    else h='<h3>📲 홈 화면에 추가</h3><ol><li>브라우저의 <b>메뉴(⋮ 또는 ≡)</b>를 눌러요</li><li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 골라요</li><li><b>추가(설치)</b>를 누르면 끝!</li></ol>';
    var sc=document.createElement('div');sc.className='pi-scrim';sc.innerHTML='<div class="pi-sheet" role="dialog" aria-modal="true">'+h+'<button type="button">닫기</button></div>';
    document.body.appendChild(sc);
    function close(){sc.remove();}
    sc.addEventListener('click',function(e){if(e.target===sc)close();});
    sc.querySelector('.pi-sheet>button').onclick=close;
  }
  function install(){
    if(deferred&&!inApp()){var p=deferred;deferred=null;p.prompt();return;}
    guide();
  }
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;});
  window.addEventListener('appinstalled',function(){deferred=null;document.querySelectorAll('[data-install]').forEach(function(b){b.hidden=true;});});
  function wire(){
    document.querySelectorAll('[data-install]').forEach(function(b){
      b.hidden=standalone();
      b.addEventListener('click',install);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  window.NaiteInstall={install:install,standalone:standalone};
})();
