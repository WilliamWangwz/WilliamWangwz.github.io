'use strict';
const range=document.querySelector('#focus-comparison');
if(range){const overlay=document.querySelector('.slider-frame .overlay');const divider=document.querySelector('.slider-divider');const output=document.querySelector('#comparison-position');range.addEventListener('input',()=>{overlay.style.clipPath=`inset(0 ${100-Number(range.value)}% 0 0)`;divider.style.left=range.value+'%';output.value=range.value+'%';});}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
