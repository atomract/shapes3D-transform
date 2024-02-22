import '../css/global.css';
import '../scss/global.scss';

import Three from './three';

document.addEventListener('DOMContentLoaded', () => {});

window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas');
  const canvas2 = document.querySelector('#canvas2');

  if (canvas) {
    new Three(document.querySelector('#canvas'));
  }
  
  if (canvas2) {
    new Three(document.querySelector('#canvas2'));
  }
});
