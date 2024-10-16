const path = require('path');
const rebuildCate = require('@sattyap/builder-electron');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist/src');

const excludeObfuscation = ['module.js'];
const excludeCopy = ['../.npmrc', 'dev'];

rebuildCate(srcDir, distDir, excludeObfuscation, excludeCopy);
