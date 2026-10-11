'use strict';
const frame=document.querySelector('#focus-comparison');
if(frame){
 const overlay=frame.querySelector('.overlay'),divider=frame.querySelector('.slider-divider');let value=50,active=null;
 const update=next=>{value=Math.max(0,Math.min(100,next));overlay.style.clipPath=`inset(0 ${100-value}% 0 0)`;divider.style.left=value+'%';frame.setAttribute('aria-valuenow',Math.round(value));frame.setAttribute('aria-valuetext',`点源参考 ${Math.round(value)}%`);};
 const move=event=>{const rect=frame.getBoundingClientRect();update((event.clientX-rect.left)/rect.width*100);};
 frame.addEventListener('pointerdown',event=>{if(!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;active=event.pointerId;frame.focus({preventScroll:true});frame.setPointerCapture(active);move(event);});
 frame.addEventListener('pointermove',event=>{if(event.pointerId===active)move(event);});
 const end=event=>{if(event.pointerId===active)active=null;};frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);frame.addEventListener('lostpointercapture',end);
 frame.addEventListener('keydown',event=>{const steps={ArrowLeft:-1,ArrowRight:1,PageDown:-10,PageUp:10};if(event.key in steps){update(value+steps[event.key]*(event.shiftKey?10:1));event.preventDefault();}else if(event.key==='Home'||event.key==='End'){update(event.key==='Home'?0:100);event.preventDefault();}});update(50);
}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
