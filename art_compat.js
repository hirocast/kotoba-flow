// File: art_compat.js
'use strict';

window.AF_LOADED = window.AF_LOADED || [];
const SHADE_MIN = 30;
const KEYS = ['R','O','Y','L','G','F','C','B','I','P','K','W','S','T','N','A','M','D','V','E','Q'];
const HEX = ['#ff5a6a','#ff9a3c','#ffd23f','#b4e05a','#48d168','#1a633a','#7fd6f5','#4a8ff0','#3346a0','#a66be0','#ff9cc8','#fbf8f1','#ffd3b0','#e3b27a','#9a6342','#b6bcc8','#c23b55','#3d3550','#cdb4f5','#8fe6c8','#fde7a6'];
const DX = [1, -1, 0, 0];
const DY = [0, 0, 1, -1];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
