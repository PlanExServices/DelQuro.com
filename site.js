document.documentElement.classList.add('js');
// hidden garden easter egg
try {
  console.log('%c🌱 DelQuro hidden garden','color:#6bbf7a;font-weight:bold');
  localStorage.setItem('delquro_garden','/apps/plot-perks.html');
} catch(e) {}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelector('.dot.d2')?.addEventListener('click',()=>{location.href='apps/plot-perks.html'});
});
const topbar=document.querySelector('.topbar');
const menu=document.querySelector('.menu');
const nav=document.querySelector('.nav');
addEventListener('scroll',()=>topbar?.classList.toggle('stuck',scrollY>8),{passive:true});
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open);menu.textContent=open?'×':'☰'});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='☰'}));
const revealItems=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const seen=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');seen.unobserve(e.target)}}),{threshold:.12, rootMargin:'0px 0px -10% 0px'});
  revealItems.forEach(el=>seen.observe(el));
  // Fallback: ensure all visible after 900ms even if observer misses (e.g., playwright full_page)
  setTimeout(()=>{revealItems.forEach(el=>el.classList.add('on'))}, 900);
}else{
  revealItems.forEach(el=>el.classList.add('on'));
}
