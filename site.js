const topbar=document.querySelector('.topbar');
const menu=document.querySelector('.menu');
const nav=document.querySelector('.nav');
addEventListener('scroll',()=>topbar?.classList.toggle('stuck',scrollY>8),{passive:true});
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open);menu.textContent=open?'×':'☰'});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='☰'}));
const revealItems=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const seen=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');seen.unobserve(e.target)}}),{threshold:.12});
  revealItems.forEach(el=>seen.observe(el));
}else{
  revealItems.forEach(el=>el.classList.add('on'));
}
