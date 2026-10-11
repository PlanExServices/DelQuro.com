/* React Bits adaptations © 2026 David Haz; upstream 482ab1c.
 * Full notice: /assets/react-bits-LICENSE.txt. Native website-specific behavior. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const menu=document.querySelector('.menu'),nav=document.querySelector('#primary-navigation');
  function setMenu(open){nav?.classList.toggle('open',open);menu?.setAttribute('aria-expanded',String(open));menu?.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(menu)menu.textContent=open?'×':'☰'}
  menu?.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  nav?.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus()}});
  document.addEventListener('click',e=>{if(!e.target.closest('.topbar'))setMenu(false)});
  const animations=new Set();
  reduced.addEventListener('change',()=>{if(reduced.matches){animations.forEach(a=>a.cancel());animations.clear()}});
  // Short one-time entrances, with visible content even when scripting fails.
  if('IntersectionObserver' in window){
    const entrance=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(!isIntersecting)return;entrance.unobserve(target);if(!reduced.matches&&target.animate){const a=target.animate([{opacity:.4,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:400,easing:'ease-out'});animations.add(a);a.finished.then(()=>animations.delete(a)).catch(()=>{})}}),{threshold:.05});
    document.querySelectorAll('.reveal').forEach(el=>entrance.observe(el));
    const gradient=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('in-view',e.isIntersecting)));
    document.querySelectorAll('.gradient-text').forEach(el=>gradient.observe(el));
  }
  document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('page-hidden',document.hidden));
  let frame=0,point=null;
  document.addEventListener('pointermove',e=>{if(reduced.matches||!finePointer.matches||e.pointerType==='touch')return;const card=e.target.closest('.spotlight');if(!card)return;point={card,x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(()=>{frame=0;const {card,x,y}=point,rect=card.getBoundingClientRect();card.style.setProperty('--spot-x',`${x-rect.left}px`);card.style.setProperty('--spot-y',`${y-rect.top}px`)})},{passive:true});
  const form=document.querySelector('#catalog-filters');if(!form)return;
  const search=document.querySelector('#product-search'),category=document.querySelector('#category-filter'),availability=document.querySelector('#availability-filter');
  const cards=[...document.querySelectorAll('[data-product]')],count=document.querySelector('#result-count'),empty=document.querySelector('#empty-state'),rail=[...document.querySelectorAll('[data-category-link]')];
  const valid=(select,value)=>[...select.options].some(o=>o.value===value)?value:'all';
  function readLocation(){const params=new URLSearchParams(location.search);search.value=params.get('q')||'';category.value=valid(category,location.hash==='#inventory'?'veterinary':location.hash.slice(1)||params.get('category'));availability.value=valid(availability,params.get('availability'))}
  function update(save=false){const term=search.value.trim().toLocaleLowerCase();let visible=0;cards.forEach(card=>{const show=(!term||card.dataset.search.includes(term))&&(category.value==='all'||card.dataset.category===category.value)&&(availability.value==='all'||card.dataset.availability===availability.value);card.hidden=!show;if(show)visible++});count.textContent=`Showing ${visible} of ${cards.length} projects`;empty.hidden=visible!==0;rail.forEach(a=>{if(a.dataset.categoryLink===category.value)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});if(save){const url=new URL(location.href);url.search='';if(term)url.searchParams.set('q',search.value.trim());if(availability.value!=='all')url.searchParams.set('availability',availability.value);url.hash=category.value==='all'?'':category.value;history.replaceState(null,'',url)}}
  function reset(){search.value='';category.value='all';availability.value='all';update(true);search.focus()}
  form.hidden=false;form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',()=>update(true));form.addEventListener('change',()=>update(true));form.addEventListener('reset',e=>{e.preventDefault();reset()});document.querySelector('#clear-filters')?.addEventListener('click',reset);
  rail.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();category.value=a.dataset.categoryLink;update(true)}));
  addEventListener('hashchange',()=>{category.value=valid(category,location.hash==='#inventory'?'veterinary':location.hash.slice(1));update()});addEventListener('popstate',()=>{readLocation();update()});readLocation();update();
})();
