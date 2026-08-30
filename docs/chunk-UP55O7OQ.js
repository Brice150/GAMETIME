import{a as vi}from"./chunk-6RU2VHTE.js";import{b as Mi}from"./chunk-YTDT6DRP.js";import{a as Ze,b as et}from"./chunk-24C5RSWM.js";import{d as Pi,e as Si,g as Ai,h as Oi,i as Di}from"./chunk-Q7EQJBNG.js";import{A as Ke,D as _i,G as bi,h as ui,i as Ge,q as pi,v as vt,y as gi,z as Ee}from"./chunk-T63Q6KMW.js";import{a as Ye,b as ki,c as Ti,f as Ii,j as Ei,r as Ri}from"./chunk-QPZ5AONC.js";import{a as wi,b as Ci}from"./chunk-U72WKTYW.js";import{$ as Je,S as Xe,V as Qe,W as fi,X as $e,_ as yi,ca as xi,g as fe,l as ee,u as hi}from"./chunk-RKIX2NQJ.js";import{$ as ae,$b as oe,Aa as ue,Ab as M,Bb as k,Bc as di,Cb as $,Db as J,Dc as ci,Eb as Y,Ec as Z,Fb as T,Gb as d,Hb as c,Ib as b,Jc as _e,Lb as ii,Mc as D,Nc as U,Oc as mi,Pb as A,Qb as ni,Vb as P,X as Be,Xb as _,Ya as m,Yb as qe,Z as Ne,Zb as We,_b as ri,ac as L,ba as f,bc as V,d as Jt,fb as ke,fc as ai,ga as E,gc as oi,ha as R,hc as Te,ia as Yt,ic as X,jc as g,kc as N,mb as S,mc as Ie,nb as ze,nc as z,oa as O,ob as ei,oc as q,pa as Ue,pb as ti,pc as W,qc as ge,rc as bt,sa as Zt,sc as He,uc as je,vc as si,wc as li,xa as Fe,zb as pe}from"./chunk-3X6FCJA3.js";import{a as wt}from"./chunk-SYKXRTLL.js";import{a as yt}from"./chunk-3IBSX4MN.js";import{d as y,e as Kn,g as ft}from"./chunk-RA2WU32H.js";var Hi=y((Vo,Wi)=>{"use strict";Wi.exports=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}});var te=y(le=>{"use strict";var Tt,Mr=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];le.getSymbolSize=function(i){if(!i)throw new Error('"version" cannot be null or undefined');if(i<1||i>40)throw new Error('"version" should be in range from 1 to 40');return i*4+17};le.getSymbolTotalCodewords=function(i){return Mr[i]};le.getBCHDigit=function(n){let i=0;for(;n!==0;)i++,n>>>=1;return i};le.setToSJISFunction=function(i){if(typeof i!="function")throw new Error('"toSJISFunc" is not a valid function.');Tt=i};le.isKanjiModeEnabled=function(){return typeof Tt<"u"};le.toSJIS=function(i){return Tt(i)}});var it=y(B=>{"use strict";B.L={bit:1};B.M={bit:0};B.Q={bit:3};B.H={bit:2};function kr(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"l":case"low":return B.L;case"m":case"medium":return B.M;case"q":case"quartile":return B.Q;case"h":case"high":return B.H;default:throw new Error("Unknown EC Level: "+n)}}B.isValid=function(i){return i&&typeof i.bit<"u"&&i.bit>=0&&i.bit<4};B.from=function(i,e){if(B.isValid(i))return i;try{return kr(i)}catch(t){return e}}});var Qi=y((Uo,Xi)=>{"use strict";function ji(){this.buffer=[],this.length=0}ji.prototype={get:function(n){let i=Math.floor(n/8);return(this.buffer[i]>>>7-n%8&1)===1},put:function(n,i){for(let e=0;e<i;e++)this.putBit((n>>>i-e-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(n){let i=Math.floor(this.length/8);this.buffer.length<=i&&this.buffer.push(0),n&&(this.buffer[i]|=128>>>this.length%8),this.length++}};Xi.exports=ji});var Ki=y((Fo,Gi)=>{"use strict";function Re(n){if(!n||n<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=n,this.data=new Uint8Array(n*n),this.reservedBit=new Uint8Array(n*n)}Re.prototype.set=function(n,i,e,t){let r=n*this.size+i;this.data[r]=e,t&&(this.reservedBit[r]=!0)};Re.prototype.get=function(n,i){return this.data[n*this.size+i]};Re.prototype.xor=function(n,i,e){this.data[n*this.size+i]^=e};Re.prototype.isReserved=function(n,i){return this.reservedBit[n*this.size+i]};Gi.exports=Re});var $i=y(nt=>{"use strict";var Tr=te().getSymbolSize;nt.getRowColCoords=function(i){if(i===1)return[];let e=Math.floor(i/7)+2,t=Tr(i),r=t===145?26:Math.ceil((t-13)/(2*e-2))*2,a=[t-7];for(let o=1;o<e-1;o++)a[o]=a[o-1]-r;return a.push(6),a.reverse()};nt.getPositions=function(i){let e=[],t=nt.getRowColCoords(i),r=t.length;for(let a=0;a<r;a++)for(let o=0;o<r;o++)a===0&&o===0||a===0&&o===r-1||a===r-1&&o===0||e.push([t[a],t[o]]);return e}});var Zi=y(Yi=>{"use strict";var Ir=te().getSymbolSize,Ji=7;Yi.getPositions=function(i){let e=Ir(i);return[[0,0],[e-Ji,0],[0,e-Ji]]}});var en=y(w=>{"use strict";w.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};var de={N1:3,N2:3,N3:40,N4:10};w.isValid=function(i){return i!=null&&i!==""&&!isNaN(i)&&i>=0&&i<=7};w.from=function(i){return w.isValid(i)?parseInt(i,10):void 0};w.getPenaltyN1=function(i){let e=i.size,t=0,r=0,a=0,o=null,s=null;for(let l=0;l<e;l++){r=a=0,o=s=null;for(let u=0;u<e;u++){let p=i.get(l,u);p===o?r++:(r>=5&&(t+=de.N1+(r-5)),o=p,r=1),p=i.get(u,l),p===s?a++:(a>=5&&(t+=de.N1+(a-5)),s=p,a=1)}r>=5&&(t+=de.N1+(r-5)),a>=5&&(t+=de.N1+(a-5))}return t};w.getPenaltyN2=function(i){let e=i.size,t=0;for(let r=0;r<e-1;r++)for(let a=0;a<e-1;a++){let o=i.get(r,a)+i.get(r,a+1)+i.get(r+1,a)+i.get(r+1,a+1);(o===4||o===0)&&t++}return t*de.N2};w.getPenaltyN3=function(i){let e=i.size,t=0,r=0,a=0;for(let o=0;o<e;o++){r=a=0;for(let s=0;s<e;s++)r=r<<1&2047|i.get(o,s),s>=10&&(r===1488||r===93)&&t++,a=a<<1&2047|i.get(s,o),s>=10&&(a===1488||a===93)&&t++}return t*de.N3};w.getPenaltyN4=function(i){let e=0,t=i.data.length;for(let a=0;a<t;a++)e+=i.data[a];return Math.abs(Math.ceil(e*100/t/5)-10)*de.N4};function Er(n,i,e){switch(n){case w.Patterns.PATTERN000:return(i+e)%2===0;case w.Patterns.PATTERN001:return i%2===0;case w.Patterns.PATTERN010:return e%3===0;case w.Patterns.PATTERN011:return(i+e)%3===0;case w.Patterns.PATTERN100:return(Math.floor(i/2)+Math.floor(e/3))%2===0;case w.Patterns.PATTERN101:return i*e%2+i*e%3===0;case w.Patterns.PATTERN110:return(i*e%2+i*e%3)%2===0;case w.Patterns.PATTERN111:return(i*e%3+(i+e)%2)%2===0;default:throw new Error("bad maskPattern:"+n)}}w.applyMask=function(i,e){let t=e.size;for(let r=0;r<t;r++)for(let a=0;a<t;a++)e.isReserved(a,r)||e.xor(a,r,Er(i,a,r))};w.getBestMask=function(i,e){let t=Object.keys(w.Patterns).length,r=0,a=1/0;for(let o=0;o<t;o++){e(o),w.applyMask(o,i);let s=w.getPenaltyN1(i)+w.getPenaltyN2(i)+w.getPenaltyN3(i)+w.getPenaltyN4(i);w.applyMask(o,i),s<a&&(a=s,r=o)}return r}});var Et=y(It=>{"use strict";var ie=it(),rt=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],at=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];It.getBlocksCount=function(i,e){switch(e){case ie.L:return rt[(i-1)*4+0];case ie.M:return rt[(i-1)*4+1];case ie.Q:return rt[(i-1)*4+2];case ie.H:return rt[(i-1)*4+3];default:return}};It.getTotalCodewordsCount=function(i,e){switch(e){case ie.L:return at[(i-1)*4+0];case ie.M:return at[(i-1)*4+1];case ie.Q:return at[(i-1)*4+2];case ie.H:return at[(i-1)*4+3];default:return}}});var tn=y(st=>{"use strict";var Pe=new Uint8Array(512),ot=new Uint8Array(256);(function(){let i=1;for(let e=0;e<255;e++)Pe[e]=i,ot[i]=e,i<<=1,i&256&&(i^=285);for(let e=255;e<512;e++)Pe[e]=Pe[e-255]})();st.log=function(i){if(i<1)throw new Error("log("+i+")");return ot[i]};st.exp=function(i){return Pe[i]};st.mul=function(i,e){return i===0||e===0?0:Pe[ot[i]+ot[e]]}});var nn=y(Se=>{"use strict";var Rt=tn();Se.mul=function(i,e){let t=new Uint8Array(i.length+e.length-1);for(let r=0;r<i.length;r++)for(let a=0;a<e.length;a++)t[r+a]^=Rt.mul(i[r],e[a]);return t};Se.mod=function(i,e){let t=new Uint8Array(i);for(;t.length-e.length>=0;){let r=t[0];for(let o=0;o<e.length;o++)t[o]^=Rt.mul(e[o],r);let a=0;for(;a<t.length&&t[a]===0;)a++;t=t.slice(a)}return t};Se.generateECPolynomial=function(i){let e=new Uint8Array([1]);for(let t=0;t<i;t++)e=Se.mul(e,new Uint8Array([1,Rt.exp(t)]));return e}});var on=y((Qo,an)=>{"use strict";var rn=nn();function Pt(n){this.genPoly=void 0,this.degree=n,this.degree&&this.initialize(this.degree)}Pt.prototype.initialize=function(i){this.degree=i,this.genPoly=rn.generateECPolynomial(this.degree)};Pt.prototype.encode=function(i){if(!this.genPoly)throw new Error("Encoder not initialized");let e=new Uint8Array(i.length+this.degree);e.set(i);let t=rn.mod(e,this.genPoly),r=this.degree-t.length;if(r>0){let a=new Uint8Array(this.degree);return a.set(t,r),a}return t};an.exports=Pt});var St=y(sn=>{"use strict";sn.isValid=function(i){return!isNaN(i)&&i>=1&&i<=40}});var At=y(Q=>{"use strict";var ln="[0-9]+",Rr="[A-Z $%*+\\-./:]+",Ae="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";Ae=Ae.replace(/u/g,"\\u");var Pr="(?:(?![A-Z0-9 $%*+\\-./:]|"+Ae+`)(?:.|[\r
]))+`;Q.KANJI=new RegExp(Ae,"g");Q.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g");Q.BYTE=new RegExp(Pr,"g");Q.NUMERIC=new RegExp(ln,"g");Q.ALPHANUMERIC=new RegExp(Rr,"g");var Sr=new RegExp("^"+Ae+"$"),Ar=new RegExp("^"+ln+"$"),Or=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");Q.testKanji=function(i){return Sr.test(i)};Q.testNumeric=function(i){return Ar.test(i)};Q.testAlphanumeric=function(i){return Or.test(i)}});var ne=y(I=>{"use strict";var Dr=St(),Ot=At();I.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]};I.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]};I.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]};I.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]};I.MIXED={bit:-1};I.getCharCountIndicator=function(i,e){if(!i.ccBits)throw new Error("Invalid mode: "+i);if(!Dr.isValid(e))throw new Error("Invalid version: "+e);return e>=1&&e<10?i.ccBits[0]:e<27?i.ccBits[1]:i.ccBits[2]};I.getBestModeForData=function(i){return Ot.testNumeric(i)?I.NUMERIC:Ot.testAlphanumeric(i)?I.ALPHANUMERIC:Ot.testKanji(i)?I.KANJI:I.BYTE};I.toString=function(i){if(i&&i.id)return i.id;throw new Error("Invalid mode")};I.isValid=function(i){return i&&i.bit&&i.ccBits};function Lr(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"numeric":return I.NUMERIC;case"alphanumeric":return I.ALPHANUMERIC;case"kanji":return I.KANJI;case"byte":return I.BYTE;default:throw new Error("Unknown mode: "+n)}}I.from=function(i,e){if(I.isValid(i))return i;try{return Lr(i)}catch(t){return e}}});var un=y(ce=>{"use strict";var lt=te(),Vr=Et(),dn=it(),re=ne(),Dt=St(),mn=7973,cn=lt.getBCHDigit(mn);function Br(n,i,e){for(let t=1;t<=40;t++)if(i<=ce.getCapacity(t,e,n))return t}function hn(n,i){return re.getCharCountIndicator(n,i)+4}function Nr(n,i){let e=0;return n.forEach(function(t){let r=hn(t.mode,i);e+=r+t.getBitsLength()}),e}function Ur(n,i){for(let e=1;e<=40;e++)if(Nr(n,e)<=ce.getCapacity(e,i,re.MIXED))return e}ce.from=function(i,e){return Dt.isValid(i)?parseInt(i,10):e};ce.getCapacity=function(i,e,t){if(!Dt.isValid(i))throw new Error("Invalid QR Code version");typeof t>"u"&&(t=re.BYTE);let r=lt.getSymbolTotalCodewords(i),a=Vr.getTotalCodewordsCount(i,e),o=(r-a)*8;if(t===re.MIXED)return o;let s=o-hn(t,i);switch(t){case re.NUMERIC:return Math.floor(s/10*3);case re.ALPHANUMERIC:return Math.floor(s/11*2);case re.KANJI:return Math.floor(s/13);case re.BYTE:default:return Math.floor(s/8)}};ce.getBestVersionForData=function(i,e){let t,r=dn.from(e,dn.M);if(Array.isArray(i)){if(i.length>1)return Ur(i,r);if(i.length===0)return 1;t=i[0]}else t=i;return Br(t.mode,t.getLength(),r)};ce.getEncodedBits=function(i){if(!Dt.isValid(i)||i<7)throw new Error("Invalid QR Code version");let e=i<<12;for(;lt.getBCHDigit(e)-cn>=0;)e^=mn<<lt.getBCHDigit(e)-cn;return i<<12|e}});var fn=y(_n=>{"use strict";var Lt=te(),gn=1335,Fr=21522,pn=Lt.getBCHDigit(gn);_n.getEncodedBits=function(i,e){let t=i.bit<<3|e,r=t<<10;for(;Lt.getBCHDigit(r)-pn>=0;)r^=gn<<Lt.getBCHDigit(r)-pn;return(t<<10|r)^Fr}});var vn=y((Zo,bn)=>{"use strict";var zr=ne();function ve(n){this.mode=zr.NUMERIC,this.data=n.toString()}ve.getBitsLength=function(i){return 10*Math.floor(i/3)+(i%3?i%3*3+1:0)};ve.prototype.getLength=function(){return this.data.length};ve.prototype.getBitsLength=function(){return ve.getBitsLength(this.data.length)};ve.prototype.write=function(i){let e,t,r;for(e=0;e+3<=this.data.length;e+=3)t=this.data.substr(e,3),r=parseInt(t,10),i.put(r,10);let a=this.data.length-e;a>0&&(t=this.data.substr(e),r=parseInt(t,10),i.put(r,a*3+1))};bn.exports=ve});var wn=y((es,yn)=>{"use strict";var qr=ne(),Vt=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function ye(n){this.mode=qr.ALPHANUMERIC,this.data=n}ye.getBitsLength=function(i){return 11*Math.floor(i/2)+6*(i%2)};ye.prototype.getLength=function(){return this.data.length};ye.prototype.getBitsLength=function(){return ye.getBitsLength(this.data.length)};ye.prototype.write=function(i){let e;for(e=0;e+2<=this.data.length;e+=2){let t=Vt.indexOf(this.data[e])*45;t+=Vt.indexOf(this.data[e+1]),i.put(t,11)}this.data.length%2&&i.put(Vt.indexOf(this.data[e]),6)};yn.exports=ye});var xn=y((ts,Cn)=>{"use strict";var Wr=ne();function we(n){this.mode=Wr.BYTE,typeof n=="string"?this.data=new TextEncoder().encode(n):this.data=new Uint8Array(n)}we.getBitsLength=function(i){return i*8};we.prototype.getLength=function(){return this.data.length};we.prototype.getBitsLength=function(){return we.getBitsLength(this.data.length)};we.prototype.write=function(n){for(let i=0,e=this.data.length;i<e;i++)n.put(this.data[i],8)};Cn.exports=we});var kn=y((is,Mn)=>{"use strict";var Hr=ne(),jr=te();function Ce(n){this.mode=Hr.KANJI,this.data=n}Ce.getBitsLength=function(i){return i*13};Ce.prototype.getLength=function(){return this.data.length};Ce.prototype.getBitsLength=function(){return Ce.getBitsLength(this.data.length)};Ce.prototype.write=function(n){let i;for(i=0;i<this.data.length;i++){let e=jr.toSJIS(this.data[i]);if(e>=33088&&e<=40956)e-=33088;else if(e>=57408&&e<=60351)e-=49472;else throw new Error("Invalid SJIS character: "+this.data[i]+`
Make sure your charset is UTF-8`);e=(e>>>8&255)*192+(e&255),n.put(e,13)}};Mn.exports=Ce});var Tn=y((ns,Bt)=>{"use strict";var Oe={single_source_shortest_paths:function(n,i,e){var t={},r={};r[i]=0;var a=Oe.PriorityQueue.make();a.push(i,0);for(var o,s,l,u,p,x,C,F,G;!a.empty();){o=a.pop(),s=o.value,u=o.cost,p=n[s]||{};for(l in p)p.hasOwnProperty(l)&&(x=p[l],C=u+x,F=r[l],G=typeof r[l]>"u",(G||F>C)&&(r[l]=C,a.push(l,C),t[l]=s))}if(typeof e<"u"&&typeof r[e]>"u"){var K=["Could not find a path from ",i," to ",e,"."].join("");throw new Error(K)}return t},extract_shortest_path_from_predecessor_list:function(n,i){for(var e=[],t=i,r;t;)e.push(t),r=n[t],t=n[t];return e.reverse(),e},find_path:function(n,i,e){var t=Oe.single_source_shortest_paths(n,i,e);return Oe.extract_shortest_path_from_predecessor_list(t,e)},PriorityQueue:{make:function(n){var i=Oe.PriorityQueue,e={},t;n=n||{};for(t in i)i.hasOwnProperty(t)&&(e[t]=i[t]);return e.queue=[],e.sorter=n.sorter||i.default_sorter,e},default_sorter:function(n,i){return n.cost-i.cost},push:function(n,i){var e={value:n,cost:i};this.queue.push(e),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};typeof Bt<"u"&&(Bt.exports=Oe)});var Dn=y(xe=>{"use strict";var v=ne(),Rn=vn(),Pn=wn(),Sn=xn(),An=kn(),De=At(),dt=te(),Xr=Tn();function In(n){return unescape(encodeURIComponent(n)).length}function Le(n,i,e){let t=[],r;for(;(r=n.exec(e))!==null;)t.push({data:r[0],index:r.index,mode:i,length:r[0].length});return t}function On(n){let i=Le(De.NUMERIC,v.NUMERIC,n),e=Le(De.ALPHANUMERIC,v.ALPHANUMERIC,n),t,r;return dt.isKanjiModeEnabled()?(t=Le(De.BYTE,v.BYTE,n),r=Le(De.KANJI,v.KANJI,n)):(t=Le(De.BYTE_KANJI,v.BYTE,n),r=[]),i.concat(e,t,r).sort(function(o,s){return o.index-s.index}).map(function(o){return{data:o.data,mode:o.mode,length:o.length}})}function Nt(n,i){switch(i){case v.NUMERIC:return Rn.getBitsLength(n);case v.ALPHANUMERIC:return Pn.getBitsLength(n);case v.KANJI:return An.getBitsLength(n);case v.BYTE:return Sn.getBitsLength(n)}}function Qr(n){return n.reduce(function(i,e){let t=i.length-1>=0?i[i.length-1]:null;return t&&t.mode===e.mode?(i[i.length-1].data+=e.data,i):(i.push(e),i)},[])}function Gr(n){let i=[];for(let e=0;e<n.length;e++){let t=n[e];switch(t.mode){case v.NUMERIC:i.push([t,{data:t.data,mode:v.ALPHANUMERIC,length:t.length},{data:t.data,mode:v.BYTE,length:t.length}]);break;case v.ALPHANUMERIC:i.push([t,{data:t.data,mode:v.BYTE,length:t.length}]);break;case v.KANJI:i.push([t,{data:t.data,mode:v.BYTE,length:In(t.data)}]);break;case v.BYTE:i.push([{data:t.data,mode:v.BYTE,length:In(t.data)}])}}return i}function Kr(n,i){let e={},t={start:{}},r=["start"];for(let a=0;a<n.length;a++){let o=n[a],s=[];for(let l=0;l<o.length;l++){let u=o[l],p=""+a+l;s.push(p),e[p]={node:u,lastCount:0},t[p]={};for(let x=0;x<r.length;x++){let C=r[x];e[C]&&e[C].node.mode===u.mode?(t[C][p]=Nt(e[C].lastCount+u.length,u.mode)-Nt(e[C].lastCount,u.mode),e[C].lastCount+=u.length):(e[C]&&(e[C].lastCount=u.length),t[C][p]=Nt(u.length,u.mode)+4+v.getCharCountIndicator(u.mode,i))}}r=s}for(let a=0;a<r.length;a++)t[r[a]].end=0;return{map:t,table:e}}function En(n,i){let e,t=v.getBestModeForData(n);if(e=v.from(i,t),e!==v.BYTE&&e.bit<t.bit)throw new Error('"'+n+'" cannot be encoded with mode '+v.toString(e)+`.
 Suggested mode is: `+v.toString(t));switch(e===v.KANJI&&!dt.isKanjiModeEnabled()&&(e=v.BYTE),e){case v.NUMERIC:return new Rn(n);case v.ALPHANUMERIC:return new Pn(n);case v.KANJI:return new An(n);case v.BYTE:return new Sn(n)}}xe.fromArray=function(i){return i.reduce(function(e,t){return typeof t=="string"?e.push(En(t,null)):t.data&&e.push(En(t.data,t.mode)),e},[])};xe.fromString=function(i,e){let t=On(i,dt.isKanjiModeEnabled()),r=Gr(t),a=Kr(r,e),o=Xr.find_path(a.map,"start","end"),s=[];for(let l=1;l<o.length-1;l++)s.push(a.table[o[l]].node);return xe.fromArray(Qr(s))};xe.rawSplit=function(i){return xe.fromArray(On(i,dt.isKanjiModeEnabled()))}});var Vn=y(Ln=>{"use strict";var mt=te(),Ut=it(),$r=Qi(),Jr=Ki(),Yr=$i(),Zr=Zi(),qt=en(),Wt=Et(),ea=on(),ct=un(),ta=fn(),ia=ne(),Ft=Dn();function na(n,i){let e=n.size,t=Zr.getPositions(i);for(let r=0;r<t.length;r++){let a=t[r][0],o=t[r][1];for(let s=-1;s<=7;s++)if(!(a+s<=-1||e<=a+s))for(let l=-1;l<=7;l++)o+l<=-1||e<=o+l||(s>=0&&s<=6&&(l===0||l===6)||l>=0&&l<=6&&(s===0||s===6)||s>=2&&s<=4&&l>=2&&l<=4?n.set(a+s,o+l,!0,!0):n.set(a+s,o+l,!1,!0))}}function ra(n){let i=n.size;for(let e=8;e<i-8;e++){let t=e%2===0;n.set(e,6,t,!0),n.set(6,e,t,!0)}}function aa(n,i){let e=Yr.getPositions(i);for(let t=0;t<e.length;t++){let r=e[t][0],a=e[t][1];for(let o=-2;o<=2;o++)for(let s=-2;s<=2;s++)o===-2||o===2||s===-2||s===2||o===0&&s===0?n.set(r+o,a+s,!0,!0):n.set(r+o,a+s,!1,!0)}}function oa(n,i){let e=n.size,t=ct.getEncodedBits(i),r,a,o;for(let s=0;s<18;s++)r=Math.floor(s/3),a=s%3+e-8-3,o=(t>>s&1)===1,n.set(r,a,o,!0),n.set(a,r,o,!0)}function zt(n,i,e){let t=n.size,r=ta.getEncodedBits(i,e),a,o;for(a=0;a<15;a++)o=(r>>a&1)===1,a<6?n.set(a,8,o,!0):a<8?n.set(a+1,8,o,!0):n.set(t-15+a,8,o,!0),a<8?n.set(8,t-a-1,o,!0):a<9?n.set(8,15-a-1+1,o,!0):n.set(8,15-a-1,o,!0);n.set(t-8,8,1,!0)}function sa(n,i){let e=n.size,t=-1,r=e-1,a=7,o=0;for(let s=e-1;s>0;s-=2)for(s===6&&s--;;){for(let l=0;l<2;l++)if(!n.isReserved(r,s-l)){let u=!1;o<i.length&&(u=(i[o]>>>a&1)===1),n.set(r,s-l,u),a--,a===-1&&(o++,a=7)}if(r+=t,r<0||e<=r){r-=t,t=-t;break}}}function la(n,i,e){let t=new $r;e.forEach(function(l){t.put(l.mode.bit,4),t.put(l.getLength(),ia.getCharCountIndicator(l.mode,n)),l.write(t)});let r=mt.getSymbolTotalCodewords(n),a=Wt.getTotalCodewordsCount(n,i),o=(r-a)*8;for(t.getLengthInBits()+4<=o&&t.put(0,4);t.getLengthInBits()%8!==0;)t.putBit(0);let s=(o-t.getLengthInBits())/8;for(let l=0;l<s;l++)t.put(l%2?17:236,8);return da(t,n,i)}function da(n,i,e){let t=mt.getSymbolTotalCodewords(i),r=Wt.getTotalCodewordsCount(i,e),a=t-r,o=Wt.getBlocksCount(i,e),s=t%o,l=o-s,u=Math.floor(t/o),p=Math.floor(a/o),x=p+1,C=u-p,F=new ea(C),G=0,K=new Array(o),Kt=new Array(o),pt=0,Gn=new Uint8Array(n.buffer);for(let he=0;he<o;he++){let _t=he<l?p:x;K[he]=Gn.slice(G,G+_t),Kt[he]=F.encode(K[he]),G+=_t,pt=Math.max(pt,_t)}let gt=new Uint8Array(t),$t=0,H,j;for(H=0;H<pt;H++)for(j=0;j<o;j++)H<K[j].length&&(gt[$t++]=K[j][H]);for(H=0;H<C;H++)for(j=0;j<o;j++)gt[$t++]=Kt[j][H];return gt}function ca(n,i,e,t){let r;if(Array.isArray(n))r=Ft.fromArray(n);else if(typeof n=="string"){let u=i;if(!u){let p=Ft.rawSplit(n);u=ct.getBestVersionForData(p,e)}r=Ft.fromString(n,u||40)}else throw new Error("Invalid data");let a=ct.getBestVersionForData(r,e);if(!a)throw new Error("The amount of data is too big to be stored in a QR Code");if(!i)i=a;else if(i<a)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+a+`.
`);let o=la(i,e,r),s=mt.getSymbolSize(i),l=new Jr(s);return na(l,i),ra(l),aa(l,i),zt(l,e,0),i>=7&&oa(l,i),sa(l,o),isNaN(t)&&(t=qt.getBestMask(l,zt.bind(null,l,e))),qt.applyMask(t,l),zt(l,e,t),{modules:l,version:i,errorCorrectionLevel:e,maskPattern:t,segments:r}}Ln.create=function(i,e){if(typeof i>"u"||i==="")throw new Error("No input text");let t=Ut.M,r,a;return typeof e<"u"&&(t=Ut.from(e.errorCorrectionLevel,Ut.M),r=ct.from(e.version),a=qt.from(e.maskPattern),e.toSJISFunc&&mt.setToSJISFunction(e.toSJISFunc)),ca(i,r,t,a)}});var Ht=y(me=>{"use strict";function Bn(n){if(typeof n=="number"&&(n=n.toString()),typeof n!="string")throw new Error("Color should be defined as hex string");let i=n.slice().replace("#","").split("");if(i.length<3||i.length===5||i.length>8)throw new Error("Invalid hex color: "+n);(i.length===3||i.length===4)&&(i=Array.prototype.concat.apply([],i.map(function(t){return[t,t]}))),i.length===6&&i.push("F","F");let e=parseInt(i.join(""),16);return{r:e>>24&255,g:e>>16&255,b:e>>8&255,a:e&255,hex:"#"+i.slice(0,6).join("")}}me.getOptions=function(i){i||(i={}),i.color||(i.color={});let e=typeof i.margin>"u"||i.margin===null||i.margin<0?4:i.margin,t=i.width&&i.width>=21?i.width:void 0,r=i.scale||4;return{width:t,scale:t?4:r,margin:e,color:{dark:Bn(i.color.dark||"#000000ff"),light:Bn(i.color.light||"#ffffffff")},type:i.type,rendererOpts:i.rendererOpts||{}}};me.getScale=function(i,e){return e.width&&e.width>=i+e.margin*2?e.width/(i+e.margin*2):e.scale};me.getImageWidth=function(i,e){let t=me.getScale(i,e);return Math.floor((i+e.margin*2)*t)};me.qrToImageData=function(i,e,t){let r=e.modules.size,a=e.modules.data,o=me.getScale(r,t),s=Math.floor((r+t.margin*2)*o),l=t.margin*o,u=[t.color.light,t.color.dark];for(let p=0;p<s;p++)for(let x=0;x<s;x++){let C=(p*s+x)*4,F=t.color.light;if(p>=l&&x>=l&&p<s-l&&x<s-l){let G=Math.floor((p-l)/o),K=Math.floor((x-l)/o);F=u[a[G*r+K]?1:0]}i[C++]=F.r,i[C++]=F.g,i[C++]=F.b,i[C]=F.a}}});var Nn=y(ht=>{"use strict";var jt=Ht();function ma(n,i,e){n.clearRect(0,0,i.width,i.height),i.style||(i.style={}),i.height=e,i.width=e,i.style.height=e+"px",i.style.width=e+"px"}function ha(){try{return document.createElement("canvas")}catch(n){throw new Error("You need to specify a canvas element")}}ht.render=function(i,e,t){let r=t,a=e;typeof r>"u"&&(!e||!e.getContext)&&(r=e,e=void 0),e||(a=ha()),r=jt.getOptions(r);let o=jt.getImageWidth(i.modules.size,r),s=a.getContext("2d"),l=s.createImageData(o,o);return jt.qrToImageData(l.data,i,r),ma(s,a,o),s.putImageData(l,0,0),a};ht.renderToDataURL=function(i,e,t){let r=t;typeof r>"u"&&(!e||!e.getContext)&&(r=e,e=void 0),r||(r={});let a=ht.render(i,e,r),o=r.type||"image/png",s=r.rendererOpts||{};return a.toDataURL(o,s.quality)}});var zn=y(Fn=>{"use strict";var ua=Ht();function Un(n,i){let e=n.a/255,t=i+'="'+n.hex+'"';return e<1?t+" "+i+'-opacity="'+e.toFixed(2).slice(1)+'"':t}function Xt(n,i,e){let t=n+i;return typeof e<"u"&&(t+=" "+e),t}function pa(n,i,e){let t="",r=0,a=!1,o=0;for(let s=0;s<n.length;s++){let l=Math.floor(s%i),u=Math.floor(s/i);!l&&!a&&(a=!0),n[s]?(o++,s>0&&l>0&&n[s-1]||(t+=a?Xt("M",l+e,.5+u+e):Xt("m",r,0),r=0,a=!1),l+1<i&&n[s+1]||(t+=Xt("h",o),o=0)):r++}return t}Fn.render=function(i,e,t){let r=ua.getOptions(e),a=i.modules.size,o=i.modules.data,s=a+r.margin*2,l=r.color.light.a?"<path "+Un(r.color.light,"fill")+' d="M0 0h'+s+"v"+s+'H0z"/>':"",u="<path "+Un(r.color.dark,"stroke")+' d="'+pa(o,a,r.margin)+'"/>',p='viewBox="0 0 '+s+" "+s+'"',C='<svg xmlns="http://www.w3.org/2000/svg" '+(r.width?'width="'+r.width+'" height="'+r.width+'" ':"")+p+' shape-rendering="crispEdges">'+l+u+`</svg>
`;return typeof t=="function"&&t(null,C),C}});var Wn=y(Ve=>{"use strict";var ga=Hi(),Qt=Vn(),qn=Nn(),_a=zn();function Gt(n,i,e,t,r){let a=[].slice.call(arguments,1),o=a.length,s=typeof a[o-1]=="function";if(!s&&!ga())throw new Error("Callback required as last argument");if(s){if(o<2)throw new Error("Too few arguments provided");o===2?(r=e,e=i,i=t=void 0):o===3&&(i.getContext&&typeof r>"u"?(r=t,t=void 0):(r=t,t=e,e=i,i=void 0))}else{if(o<1)throw new Error("Too few arguments provided");return o===1?(e=i,i=t=void 0):o===2&&!i.getContext&&(t=e,e=i,i=void 0),new Promise(function(l,u){try{let p=Qt.create(e,t);l(n(p,i,t))}catch(p){u(p)}})}try{let l=Qt.create(e,t);r(null,n(l,i,t))}catch(l){r(l)}}Ve.create=Qt.create;Ve.toCanvas=Gt.bind(null,qn.render);Ve.toDataURL=Gt.bind(null,qn.renderToDataURL);Ve.toString=Gt.bind(null,function(n,i,e){return _a.render(n,e)})});var $n=["switch"],Jn=["*"];function Yn(n,i){n&1&&(d(0,"span",11),Yt(),d(1,"svg",13),b(2,"path",14),c(),d(3,"svg",15),b(4,"path",16),c()())}var Zn=new ae("mat-slide-toggle-default-options",{providedIn:"root",factory:()=>({disableToggleValue:!1,hideIcon:!1,disabledInteractive:!1})}),tt=class{source;checked;constructor(i,e){this.source=i,this.checked=e}},Ct=(()=>{class n{_elementRef=f(ue);_focusMonitor=f(ui);_changeDetectorRef=f(_e);defaults=f(Zn);_onChange=e=>{};_onTouched=()=>{};_validatorOnChange=()=>{};_uniqueId;_checked=!1;_createChangeEvent(e){return new tt(this,e)}_labelId;get buttonId(){return`${this.id||this._uniqueId}-button`}_switchElement;focus(){this._switchElement.nativeElement.focus()}_noopAnimations=Qe();_focused=!1;name=null;id;labelPosition="after";ariaLabel=null;ariaLabelledby=null;ariaDescribedby;required=!1;color;disabled=!1;disableRipple=!1;tabIndex=0;get checked(){return this._checked}set checked(e){this._checked=e,this._changeDetectorRef.markForCheck()}hideIcon;disabledInteractive;change=new O;toggleChange=new O;get inputId(){return`${this.id||this._uniqueId}-input`}constructor(){f(Ge).load(Ke);let e=f(new ci("tabindex"),{optional:!0}),t=this.defaults;this.tabIndex=e==null?0:parseInt(e)||0,this.color=t.color||"accent",this.id=this._uniqueId=f(pi).getId("mat-mdc-slide-toggle-"),this.hideIcon=t.hideIcon??!1,this.disabledInteractive=t.disabledInteractive??!1,this._labelId=this._uniqueId+"-label"}ngAfterContentInit(){this._focusMonitor.monitor(this._elementRef,!0).subscribe(e=>{e==="keyboard"||e==="program"?(this._focused=!0,this._changeDetectorRef.markForCheck()):e||Promise.resolve().then(()=>{this._focused=!1,this._onTouched(),this._changeDetectorRef.markForCheck()})})}ngOnChanges(e){e.required&&this._validatorOnChange()}ngOnDestroy(){this._focusMonitor.stopMonitoring(this._elementRef)}writeValue(e){this.checked=!!e}registerOnChange(e){this._onChange=e}registerOnTouched(e){this._onTouched=e}validate(e){return this.required&&e.value!==!0?{required:!0}:null}registerOnValidatorChange(e){this._validatorOnChange=e}setDisabledState(e){this.disabled=e,this._changeDetectorRef.markForCheck()}toggle(){this.checked=!this.checked,this._onChange(this.checked)}_emitChangeEvent(){this._onChange(this.checked),this.change.emit(this._createChangeEvent(this.checked))}_handleClick(){this.disabled||(this.toggleChange.emit(),this.defaults.disableToggleValue||(this.checked=!this.checked,this._onChange(this.checked),this.change.emit(new tt(this,this.checked))))}_getAriaLabelledBy(){return this.ariaLabelledby?this.ariaLabelledby:this.ariaLabel?null:this._labelId}static \u0275fac=function(t){return new(t||n)};static \u0275cmp=S({type:n,selectors:[["mat-slide-toggle"]],viewQuery:function(t,r){if(t&1&&oe($n,5),t&2){let a;L(a=V())&&(r._switchElement=a.first)}},hostAttrs:[1,"mat-mdc-slide-toggle"],hostVars:13,hostBindings:function(t,r){t&2&&(ni("id",r.id),pe("tabindex",null)("aria-label",null)("name",null)("aria-labelledby",null),X(r.color?"mat-"+r.color:""),Te("mat-mdc-slide-toggle-focused",r._focused)("mat-mdc-slide-toggle-checked",r.checked)("_mat-animation-noopable",r._noopAnimations))},inputs:{name:"name",id:"id",labelPosition:"labelPosition",ariaLabel:[0,"aria-label","ariaLabel"],ariaLabelledby:[0,"aria-labelledby","ariaLabelledby"],ariaDescribedby:[0,"aria-describedby","ariaDescribedby"],required:[2,"required","required",D],color:"color",disabled:[2,"disabled","disabled",D],disableRipple:[2,"disableRipple","disableRipple",D],tabIndex:[2,"tabIndex","tabIndex",e=>e==null?0:U(e)],checked:[2,"checked","checked",D],hideIcon:[2,"hideIcon","hideIcon",D],disabledInteractive:[2,"disabledInteractive","disabledInteractive",D]},outputs:{change:"change",toggleChange:"toggleChange"},exportAs:["matSlideToggle"],features:[ge([{provide:Ye,useExisting:Be(()=>n),multi:!0},{provide:Ti,useExisting:n,multi:!0}]),Fe],ngContentSelectors:Jn,decls:14,vars:27,consts:[["switch",""],["mat-internal-form-field","",3,"labelPosition"],["role","switch","type","button",1,"mdc-switch",3,"click","tabIndex","disabled"],[1,"mat-mdc-slide-toggle-touch-target"],[1,"mdc-switch__track"],[1,"mdc-switch__handle-track"],[1,"mdc-switch__handle"],[1,"mdc-switch__shadow"],[1,"mdc-elevation-overlay"],[1,"mdc-switch__ripple"],["mat-ripple","",1,"mat-mdc-slide-toggle-ripple","mat-focus-indicator",3,"matRippleTrigger","matRippleDisabled","matRippleCentered"],[1,"mdc-switch__icons"],[1,"mdc-label",3,"click","for"],["viewBox","0 0 24 24","aria-hidden","true",1,"mdc-switch__icon","mdc-switch__icon--on"],["d","M19.69,5.23L8.96,15.96l-4.23-4.23L2.96,13.5l6,6L21.46,7L19.69,5.23z"],["viewBox","0 0 24 24","aria-hidden","true",1,"mdc-switch__icon","mdc-switch__icon--off"],["d","M20 13H4v-2h16v2z"]],template:function(t,r){if(t&1&&(qe(),d(0,"div",1)(1,"button",2,0),P("click",function(){return r._handleClick()}),b(3,"div",3)(4,"span",4),d(5,"span",5)(6,"span",6)(7,"span",7),b(8,"span",8),c(),d(9,"span",9),b(10,"span",10),c(),M(11,Yn,5,0,"span",11),c()()(),d(12,"label",12),P("click",function(o){return o.stopPropagation()}),We(13),c()()),t&2){let a=ai(2);T("labelPosition",r.labelPosition),m(),Te("mdc-switch--selected",r.checked)("mdc-switch--unselected",!r.checked)("mdc-switch--checked",r.checked)("mdc-switch--disabled",r.disabled)("mat-mdc-slide-toggle-disabled-interactive",r.disabledInteractive),T("tabIndex",r.disabled&&!r.disabledInteractive?-1:r.tabIndex)("disabled",r.disabled&&!r.disabledInteractive),pe("id",r.buttonId)("name",r.name)("aria-label",r.ariaLabel)("aria-labelledby",r._getAriaLabelledBy())("aria-describedby",r.ariaDescribedby)("aria-required",r.required||null)("aria-checked",r.checked)("aria-disabled",r.disabled&&r.disabledInteractive?"true":null),m(9),T("matRippleTrigger",a)("matRippleDisabled",r.disableRipple||r.disabled)("matRippleCentered",!0),m(),k(r.hideIcon?-1:11),m(),T("for",r.buttonId),pe("id",r._labelId)}},dependencies:[Ee,vi],styles:[`.mdc-switch {
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  margin: 0;
  outline: none;
  overflow: visible;
  padding: 0;
  position: relative;
  width: var(--mat-slide-toggle-track-width, 52px);
}
.mdc-switch.mdc-switch--disabled {
  cursor: default;
  pointer-events: none;
}
.mdc-switch.mat-mdc-slide-toggle-disabled-interactive {
  pointer-events: auto;
}

.mdc-switch__track {
  overflow: hidden;
  position: relative;
  width: 100%;
  height: var(--mat-slide-toggle-track-height, 32px);
  border-radius: var(--mat-slide-toggle-track-shape, var(--mat-sys-corner-full));
}
.mdc-switch--disabled.mdc-switch .mdc-switch__track {
  opacity: var(--mat-slide-toggle-disabled-track-opacity, 0.12);
}
.mdc-switch__track::before, .mdc-switch__track::after {
  border: 1px solid transparent;
  border-radius: inherit;
  box-sizing: border-box;
  content: "";
  height: 100%;
  left: 0;
  position: absolute;
  width: 100%;
  border-width: var(--mat-slide-toggle-track-outline-width, 2px);
  border-color: var(--mat-slide-toggle-track-outline-color, var(--mat-sys-outline));
}
.mdc-switch--selected .mdc-switch__track::before, .mdc-switch--selected .mdc-switch__track::after {
  border-width: var(--mat-slide-toggle-selected-track-outline-width, 2px);
  border-color: var(--mat-slide-toggle-selected-track-outline-color, transparent);
}
.mdc-switch--disabled .mdc-switch__track::before, .mdc-switch--disabled .mdc-switch__track::after {
  border-width: var(--mat-slide-toggle-disabled-unselected-track-outline-width, 2px);
  border-color: var(--mat-slide-toggle-disabled-unselected-track-outline-color, var(--mat-sys-on-surface));
}
@media (forced-colors: active) {
  .mdc-switch__track {
    border-color: currentColor;
  }
}
.mdc-switch__track::before {
  transition: transform 75ms 0ms cubic-bezier(0, 0, 0.2, 1);
  transform: translateX(0);
  background: var(--mat-slide-toggle-unselected-track-color, var(--mat-sys-surface-variant));
}
.mdc-switch--selected .mdc-switch__track::before {
  transition: transform 75ms 0ms cubic-bezier(0.4, 0, 0.6, 1);
  transform: translateX(100%);
}
[dir=rtl] .mdc-switch--selected .mdc-switch--selected .mdc-switch__track::before {
  transform: translateX(-100%);
}
.mdc-switch--selected .mdc-switch__track::before {
  opacity: var(--mat-slide-toggle-hidden-track-opacity, 0);
  transition: var(--mat-slide-toggle-hidden-track-transition, opacity 75ms);
}
.mdc-switch--unselected .mdc-switch__track::before {
  opacity: var(--mat-slide-toggle-visible-track-opacity, 1);
  transition: var(--mat-slide-toggle-visible-track-transition, opacity 75ms);
}
.mdc-switch:enabled:hover:not(:focus):not(:active) .mdc-switch__track::before {
  background: var(--mat-slide-toggle-unselected-hover-track-color, var(--mat-sys-surface-variant));
}
.mdc-switch:enabled:focus:not(:active) .mdc-switch__track::before {
  background: var(--mat-slide-toggle-unselected-focus-track-color, var(--mat-sys-surface-variant));
}
.mdc-switch:enabled:active .mdc-switch__track::before {
  background: var(--mat-slide-toggle-unselected-pressed-track-color, var(--mat-sys-surface-variant));
}
.mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:hover:not(:focus):not(:active) .mdc-switch__track::before, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:focus:not(:active) .mdc-switch__track::before, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:active .mdc-switch__track::before, .mdc-switch.mdc-switch--disabled .mdc-switch__track::before {
  background: var(--mat-slide-toggle-disabled-unselected-track-color, var(--mat-sys-surface-variant));
}
.mdc-switch__track::after {
  transform: translateX(-100%);
  background: var(--mat-slide-toggle-selected-track-color, var(--mat-sys-primary));
}
[dir=rtl] .mdc-switch__track::after {
  transform: translateX(100%);
}
.mdc-switch--selected .mdc-switch__track::after {
  transform: translateX(0);
}
.mdc-switch--selected .mdc-switch__track::after {
  opacity: var(--mat-slide-toggle-visible-track-opacity, 1);
  transition: var(--mat-slide-toggle-visible-track-transition, opacity 75ms);
}
.mdc-switch--unselected .mdc-switch__track::after {
  opacity: var(--mat-slide-toggle-hidden-track-opacity, 0);
  transition: var(--mat-slide-toggle-hidden-track-transition, opacity 75ms);
}
.mdc-switch:enabled:hover:not(:focus):not(:active) .mdc-switch__track::after {
  background: var(--mat-slide-toggle-selected-hover-track-color, var(--mat-sys-primary));
}
.mdc-switch:enabled:focus:not(:active) .mdc-switch__track::after {
  background: var(--mat-slide-toggle-selected-focus-track-color, var(--mat-sys-primary));
}
.mdc-switch:enabled:active .mdc-switch__track::after {
  background: var(--mat-slide-toggle-selected-pressed-track-color, var(--mat-sys-primary));
}
.mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:hover:not(:focus):not(:active) .mdc-switch__track::after, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:focus:not(:active) .mdc-switch__track::after, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:active .mdc-switch__track::after, .mdc-switch.mdc-switch--disabled .mdc-switch__track::after {
  background: var(--mat-slide-toggle-disabled-selected-track-color, var(--mat-sys-on-surface));
}

.mdc-switch__handle-track {
  height: 100%;
  pointer-events: none;
  position: absolute;
  top: 0;
  transition: transform 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1);
  left: 0;
  right: auto;
  transform: translateX(0);
  width: calc(100% - var(--mat-slide-toggle-handle-width));
}
[dir=rtl] .mdc-switch__handle-track {
  left: auto;
  right: 0;
}
.mdc-switch--selected .mdc-switch__handle-track {
  transform: translateX(100%);
}
[dir=rtl] .mdc-switch--selected .mdc-switch__handle-track {
  transform: translateX(-100%);
}

.mdc-switch__handle {
  display: flex;
  pointer-events: auto;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  right: auto;
  transition: width 75ms cubic-bezier(0.4, 0, 0.2, 1), height 75ms cubic-bezier(0.4, 0, 0.2, 1), margin 75ms cubic-bezier(0.4, 0, 0.2, 1);
  width: var(--mat-slide-toggle-handle-width);
  height: var(--mat-slide-toggle-handle-height);
  border-radius: var(--mat-slide-toggle-handle-shape, var(--mat-sys-corner-full));
}
[dir=rtl] .mdc-switch__handle {
  left: auto;
  right: 0;
}
.mat-mdc-slide-toggle .mdc-switch--unselected .mdc-switch__handle {
  width: var(--mat-slide-toggle-unselected-handle-size, 16px);
  height: var(--mat-slide-toggle-unselected-handle-size, 16px);
  margin: var(--mat-slide-toggle-unselected-handle-horizontal-margin, 0 8px);
}
.mat-mdc-slide-toggle .mdc-switch--unselected .mdc-switch__handle:has(.mdc-switch__icons) {
  margin: var(--mat-slide-toggle-unselected-with-icon-handle-horizontal-margin, 0 4px);
}
.mat-mdc-slide-toggle .mdc-switch--selected .mdc-switch__handle {
  width: var(--mat-slide-toggle-selected-handle-size, 24px);
  height: var(--mat-slide-toggle-selected-handle-size, 24px);
  margin: var(--mat-slide-toggle-selected-handle-horizontal-margin, 0 24px);
}
.mat-mdc-slide-toggle .mdc-switch--selected .mdc-switch__handle:has(.mdc-switch__icons) {
  margin: var(--mat-slide-toggle-selected-with-icon-handle-horizontal-margin, 0 24px);
}
.mat-mdc-slide-toggle .mdc-switch__handle:has(.mdc-switch__icons) {
  width: var(--mat-slide-toggle-with-icon-handle-size, 24px);
  height: var(--mat-slide-toggle-with-icon-handle-size, 24px);
}
.mat-mdc-slide-toggle .mdc-switch:active:not(.mdc-switch--disabled) .mdc-switch__handle {
  width: var(--mat-slide-toggle-pressed-handle-size, 28px);
  height: var(--mat-slide-toggle-pressed-handle-size, 28px);
}
.mat-mdc-slide-toggle .mdc-switch--selected:active:not(.mdc-switch--disabled) .mdc-switch__handle {
  margin: var(--mat-slide-toggle-selected-pressed-handle-horizontal-margin, 0 22px);
}
.mat-mdc-slide-toggle .mdc-switch--unselected:active:not(.mdc-switch--disabled) .mdc-switch__handle {
  margin: var(--mat-slide-toggle-unselected-pressed-handle-horizontal-margin, 0 2px);
}
.mdc-switch--disabled.mdc-switch--selected .mdc-switch__handle::after {
  opacity: var(--mat-slide-toggle-disabled-selected-handle-opacity, 1);
}
.mdc-switch--disabled.mdc-switch--unselected .mdc-switch__handle::after {
  opacity: var(--mat-slide-toggle-disabled-unselected-handle-opacity, 0.38);
}
.mdc-switch__handle::before, .mdc-switch__handle::after {
  border: 1px solid transparent;
  border-radius: inherit;
  box-sizing: border-box;
  content: "";
  width: 100%;
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  transition: background-color 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1), border-color 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}
@media (forced-colors: active) {
  .mdc-switch__handle::before, .mdc-switch__handle::after {
    border-color: currentColor;
  }
}
.mdc-switch--selected:enabled .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-selected-handle-color, var(--mat-sys-on-primary));
}
.mdc-switch--selected:enabled:hover:not(:focus):not(:active) .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-selected-hover-handle-color, var(--mat-sys-primary-container));
}
.mdc-switch--selected:enabled:focus:not(:active) .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-selected-focus-handle-color, var(--mat-sys-primary-container));
}
.mdc-switch--selected:enabled:active .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-selected-pressed-handle-color, var(--mat-sys-primary-container));
}
.mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled.mdc-switch--selected:hover:not(:focus):not(:active) .mdc-switch__handle::after, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled.mdc-switch--selected:focus:not(:active) .mdc-switch__handle::after, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled.mdc-switch--selected:active .mdc-switch__handle::after, .mdc-switch--selected.mdc-switch--disabled .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-disabled-selected-handle-color, var(--mat-sys-surface));
}
.mdc-switch--unselected:enabled .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-unselected-handle-color, var(--mat-sys-outline));
}
.mdc-switch--unselected:enabled:hover:not(:focus):not(:active) .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-unselected-hover-handle-color, var(--mat-sys-on-surface-variant));
}
.mdc-switch--unselected:enabled:focus:not(:active) .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-unselected-focus-handle-color, var(--mat-sys-on-surface-variant));
}
.mdc-switch--unselected:enabled:active .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-unselected-pressed-handle-color, var(--mat-sys-on-surface-variant));
}
.mdc-switch--unselected.mdc-switch--disabled .mdc-switch__handle::after {
  background: var(--mat-slide-toggle-disabled-unselected-handle-color, var(--mat-sys-on-surface));
}
.mdc-switch__handle::before {
  background: var(--mat-slide-toggle-handle-surface-color);
}

.mdc-switch__shadow {
  border-radius: inherit;
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}
.mdc-switch:enabled .mdc-switch__shadow {
  box-shadow: var(--mat-slide-toggle-handle-elevation-shadow);
}
.mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:hover:not(:focus):not(:active) .mdc-switch__shadow, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:focus:not(:active) .mdc-switch__shadow, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:active .mdc-switch__shadow, .mdc-switch.mdc-switch--disabled .mdc-switch__shadow {
  box-shadow: var(--mat-slide-toggle-disabled-handle-elevation-shadow);
}

.mdc-switch__ripple {
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
  width: var(--mat-slide-toggle-state-layer-size, 40px);
  height: var(--mat-slide-toggle-state-layer-size, 40px);
}
.mdc-switch__ripple::after {
  content: "";
  opacity: 0;
}
.mdc-switch--disabled .mdc-switch__ripple::after {
  display: none;
}
.mat-mdc-slide-toggle-disabled-interactive .mdc-switch__ripple::after {
  display: block;
}
.mdc-switch:hover .mdc-switch__ripple::after {
  transition: 75ms opacity cubic-bezier(0, 0, 0.2, 1);
}
.mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:enabled:focus .mdc-switch__ripple::after, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:enabled:active .mdc-switch__ripple::after, .mat-mdc-slide-toggle-disabled-interactive.mdc-switch--disabled:enabled:hover:not(:focus) .mdc-switch__ripple::after, .mdc-switch--unselected:enabled:hover:not(:focus) .mdc-switch__ripple::after {
  background: var(--mat-slide-toggle-unselected-hover-state-layer-color, var(--mat-sys-on-surface));
  opacity: var(--mat-slide-toggle-unselected-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity));
}
.mdc-switch--unselected:enabled:focus .mdc-switch__ripple::after {
  background: var(--mat-slide-toggle-unselected-focus-state-layer-color, var(--mat-sys-on-surface));
  opacity: var(--mat-slide-toggle-unselected-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity));
}
.mdc-switch--unselected:enabled:active .mdc-switch__ripple::after {
  background: var(--mat-slide-toggle-unselected-pressed-state-layer-color, var(--mat-sys-on-surface));
  opacity: var(--mat-slide-toggle-unselected-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity));
  transition: opacity 75ms linear;
}
.mdc-switch--selected:enabled:hover:not(:focus) .mdc-switch__ripple::after {
  background: var(--mat-slide-toggle-selected-hover-state-layer-color, var(--mat-sys-primary));
  opacity: var(--mat-slide-toggle-selected-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity));
}
.mdc-switch--selected:enabled:focus .mdc-switch__ripple::after {
  background: var(--mat-slide-toggle-selected-focus-state-layer-color, var(--mat-sys-primary));
  opacity: var(--mat-slide-toggle-selected-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity));
}
.mdc-switch--selected:enabled:active .mdc-switch__ripple::after {
  background: var(--mat-slide-toggle-selected-pressed-state-layer-color, var(--mat-sys-primary));
  opacity: var(--mat-slide-toggle-selected-pressed-state-layer-opacity, var(--mat-sys-pressed-state-layer-opacity));
  transition: opacity 75ms linear;
}

.mdc-switch__icons {
  position: relative;
  height: 100%;
  width: 100%;
  z-index: 1;
  transform: translateZ(0);
}
.mdc-switch--disabled.mdc-switch--unselected .mdc-switch__icons {
  opacity: var(--mat-slide-toggle-disabled-unselected-icon-opacity, 0.38);
}
.mdc-switch--disabled.mdc-switch--selected .mdc-switch__icons {
  opacity: var(--mat-slide-toggle-disabled-selected-icon-opacity, 0.38);
}

.mdc-switch__icon {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 30ms 0ms cubic-bezier(0.4, 0, 1, 1);
}
.mdc-switch--unselected .mdc-switch__icon {
  width: var(--mat-slide-toggle-unselected-icon-size, 16px);
  height: var(--mat-slide-toggle-unselected-icon-size, 16px);
  fill: var(--mat-slide-toggle-unselected-icon-color, var(--mat-sys-surface-variant));
}
.mdc-switch--unselected.mdc-switch--disabled .mdc-switch__icon {
  fill: var(--mat-slide-toggle-disabled-unselected-icon-color, var(--mat-sys-surface-variant));
}
.mdc-switch--selected .mdc-switch__icon {
  width: var(--mat-slide-toggle-selected-icon-size, 16px);
  height: var(--mat-slide-toggle-selected-icon-size, 16px);
  fill: var(--mat-slide-toggle-selected-icon-color, var(--mat-sys-on-primary-container));
}
.mdc-switch--selected.mdc-switch--disabled .mdc-switch__icon {
  fill: var(--mat-slide-toggle-disabled-selected-icon-color, var(--mat-sys-on-surface));
}

.mdc-switch--selected .mdc-switch__icon--on,
.mdc-switch--unselected .mdc-switch__icon--off {
  opacity: 1;
  transition: opacity 45ms 30ms cubic-bezier(0, 0, 0.2, 1);
}

.mat-mdc-slide-toggle {
  -webkit-user-select: none;
  user-select: none;
  display: inline-block;
  -webkit-tap-highlight-color: transparent;
  outline: 0;
}
.mat-mdc-slide-toggle .mat-mdc-slide-toggle-ripple,
.mat-mdc-slide-toggle .mdc-switch__ripple::after {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.mat-mdc-slide-toggle .mat-mdc-slide-toggle-ripple:not(:empty),
.mat-mdc-slide-toggle .mdc-switch__ripple::after:not(:empty) {
  transform: translateZ(0);
}
.mat-mdc-slide-toggle.mat-mdc-slide-toggle-focused .mat-focus-indicator::before {
  content: "";
}
.mat-mdc-slide-toggle .mat-internal-form-field {
  color: var(--mat-slide-toggle-label-text-color, var(--mat-sys-on-surface));
  font-family: var(--mat-slide-toggle-label-text-font, var(--mat-sys-body-medium-font));
  line-height: var(--mat-slide-toggle-label-text-line-height, var(--mat-sys-body-medium-line-height));
  font-size: var(--mat-slide-toggle-label-text-size, var(--mat-sys-body-medium-size));
  letter-spacing: var(--mat-slide-toggle-label-text-tracking, var(--mat-sys-body-medium-tracking));
  font-weight: var(--mat-slide-toggle-label-text-weight, var(--mat-sys-body-medium-weight));
}
.mat-mdc-slide-toggle .mat-ripple-element {
  opacity: 0.12;
}
.mat-mdc-slide-toggle .mat-focus-indicator::before {
  border-radius: 50%;
}
.mat-mdc-slide-toggle._mat-animation-noopable .mdc-switch__handle-track,
.mat-mdc-slide-toggle._mat-animation-noopable .mdc-switch__icon,
.mat-mdc-slide-toggle._mat-animation-noopable .mdc-switch__handle::before,
.mat-mdc-slide-toggle._mat-animation-noopable .mdc-switch__handle::after,
.mat-mdc-slide-toggle._mat-animation-noopable .mdc-switch__track::before,
.mat-mdc-slide-toggle._mat-animation-noopable .mdc-switch__track::after {
  transition: none;
}
.mat-mdc-slide-toggle .mdc-switch:enabled + .mdc-label {
  cursor: pointer;
}
.mat-mdc-slide-toggle .mdc-switch--disabled + label {
  color: var(--mat-slide-toggle-disabled-label-text-color, var(--mat-sys-on-surface));
}
.mat-mdc-slide-toggle label:empty {
  display: none;
}

.mat-mdc-slide-toggle-touch-target {
  position: absolute;
  top: 50%;
  left: 50%;
  height: var(--mat-slide-toggle-touch-target-size, 48px);
  width: 100%;
  transform: translate(-50%, -50%);
  display: var(--mat-slide-toggle-touch-target-display, block);
}
[dir=rtl] .mat-mdc-slide-toggle-touch-target {
  left: auto;
  right: 50%;
  transform: translate(50%, -50%);
}
`],encapsulation:2,changeDetection:0})}return n})(),Li=(()=>{class n{static \u0275fac=function(t){return new(t||n)};static \u0275mod=ze({type:n});static \u0275inj=Ne({imports:[Ct,$e]})}return n})();var tr=["knob"],ir=["valueIndicatorContainer"];function nr(n,i){if(n&1&&(d(0,"div",2,1)(2,"div",5)(3,"span",6),g(4),c()()()),n&2){let e=_();m(4),N(e.valueIndicatorText)}}var rr=["trackActive"],ar=["*"];function or(n,i){if(n&1&&b(0,"div"),n&2){let e=i.$implicit,t=i.$index,r=_(3);X(e===0?"mdc-slider__tick-mark--active":"mdc-slider__tick-mark--inactive"),oi("transform",r._calcTickMarkTransform(t))}}function sr(n,i){if(n&1&&J(0,or,1,4,"div",8,$),n&2){let e=_(2);Y(e._tickMarks)}}function lr(n,i){if(n&1&&(d(0,"div",6,1),M(2,sr,2,0),c()),n&2){let e=_();m(2),k(e._cachedWidth?2:-1)}}function dr(n,i){if(n&1&&b(0,"mat-slider-visual-thumb",7),n&2){let e=_();T("discrete",e.discrete)("thumbPosition",1)("valueIndicatorText",e.startValueIndicatorText)}}var h=(function(n){return n[n.START=1]="START",n[n.END=2]="END",n})(h||{}),be=(function(n){return n[n.ACTIVE=0]="ACTIVE",n[n.INACTIVE=1]="INACTIVE",n})(be||{}),xt=new ae("_MatSlider"),Vi=new ae("_MatSliderThumb"),cr=new ae("_MatSliderRangeThumb"),Bi=new ae("_MatSliderVisualThumb");var mr=(()=>{class n{_cdr=f(_e);_ngZone=f(Ue);_slider=f(xt);_renderer=f(ke);_listenerCleanups;discrete=!1;thumbPosition;valueIndicatorText;_ripple;_knob;_valueIndicatorContainer;_sliderInput;_sliderInputEl;_hoverRippleRef;_focusRippleRef;_activeRippleRef;_isHovered=!1;_isActive=!1;_isValueIndicatorVisible=!1;_hostElement=f(ue).nativeElement;_platform=f(Xe);constructor(){}ngAfterViewInit(){let e=this._slider._getInput(this.thumbPosition);e&&(this._ripple.radius=24,this._sliderInput=e,this._sliderInputEl=this._sliderInput._hostElement,this._ngZone.runOutsideAngular(()=>{let t=this._sliderInputEl,r=this._renderer;this._listenerCleanups=[r.listen(t,"pointermove",this._onPointerMove),r.listen(t,"pointerdown",this._onDragStart),r.listen(t,"pointerup",this._onDragEnd),r.listen(t,"pointerleave",this._onMouseLeave),r.listen(t,"focus",this._onFocus),r.listen(t,"blur",this._onBlur)]}))}ngOnDestroy(){this._listenerCleanups?.forEach(e=>e())}_onPointerMove=e=>{if(this._sliderInput._isFocused)return;let t=this._hostElement.getBoundingClientRect(),r=this._slider._isCursorOnSliderThumb(e,t);this._isHovered=r,r?this._showHoverRipple():this._hideRipple(this._hoverRippleRef)};_onMouseLeave=()=>{this._isHovered=!1,this._hideRipple(this._hoverRippleRef)};_onFocus=()=>{this._hideRipple(this._hoverRippleRef),this._showFocusRipple(),this._hostElement.classList.add("mdc-slider__thumb--focused")};_onBlur=()=>{this._isActive||this._hideRipple(this._focusRippleRef),this._isHovered&&this._showHoverRipple(),this._hostElement.classList.remove("mdc-slider__thumb--focused")};_onDragStart=e=>{e.button===0&&(this._isActive=!0,this._showActiveRipple())};_onDragEnd=()=>{this._isActive=!1,this._hideRipple(this._activeRippleRef),this._sliderInput._isFocused||this._hideRipple(this._focusRippleRef),this._platform.SAFARI&&this._showHoverRipple()};_showHoverRipple(){this._isShowingRipple(this._hoverRippleRef)||(this._hoverRippleRef=this._showRipple({enterDuration:0,exitDuration:0}),this._hoverRippleRef?.element.classList.add("mat-mdc-slider-hover-ripple"))}_showFocusRipple(){this._isShowingRipple(this._focusRippleRef)||(this._focusRippleRef=this._showRipple({enterDuration:0,exitDuration:0},!0),this._focusRippleRef?.element.classList.add("mat-mdc-slider-focus-ripple"))}_showActiveRipple(){this._isShowingRipple(this._activeRippleRef)||(this._activeRippleRef=this._showRipple({enterDuration:225,exitDuration:400}),this._activeRippleRef?.element.classList.add("mat-mdc-slider-active-ripple"))}_isShowingRipple(e){return e?.state===vt.FADING_IN||e?.state===vt.VISIBLE}_showRipple(e,t){if(!this._slider.disabled&&(this._showValueIndicator(),this._slider._isRange&&this._slider._getThumb(this.thumbPosition===h.START?h.END:h.START)._showValueIndicator(),!(this._slider._globalRippleOptions?.disabled&&!t)))return this._ripple.launch({animation:this._slider._noopAnimations?{enterDuration:0,exitDuration:0}:e,centered:!0,persistent:!0})}_hideRipple(e){if(e?.fadeOut(),this._isShowingAnyRipple())return;this._slider._isRange||this._hideValueIndicator();let t=this._getSibling();t._isShowingAnyRipple()||(this._hideValueIndicator(),t._hideValueIndicator())}_showValueIndicator(){this._hostElement.classList.add("mdc-slider__thumb--with-indicator")}_hideValueIndicator(){this._hostElement.classList.remove("mdc-slider__thumb--with-indicator")}_getSibling(){return this._slider._getThumb(this.thumbPosition===h.START?h.END:h.START)}_getValueIndicatorContainer(){return this._valueIndicatorContainer?.nativeElement}_getKnob(){return this._knob.nativeElement}_isShowingAnyRipple(){return this._isShowingRipple(this._hoverRippleRef)||this._isShowingRipple(this._focusRippleRef)||this._isShowingRipple(this._activeRippleRef)}static \u0275fac=function(t){return new(t||n)};static \u0275cmp=S({type:n,selectors:[["mat-slider-visual-thumb"]],viewQuery:function(t,r){if(t&1&&oe(Ee,5)(tr,5)(ir,5),t&2){let a;L(a=V())&&(r._ripple=a.first),L(a=V())&&(r._knob=a.first),L(a=V())&&(r._valueIndicatorContainer=a.first)}},hostAttrs:[1,"mdc-slider__thumb","mat-mdc-slider-visual-thumb"],inputs:{discrete:"discrete",thumbPosition:"thumbPosition",valueIndicatorText:"valueIndicatorText"},features:[ge([{provide:Bi,useExisting:n}])],decls:4,vars:2,consts:[["knob",""],["valueIndicatorContainer",""],[1,"mdc-slider__value-indicator-container"],[1,"mdc-slider__thumb-knob"],["matRipple","",1,"mat-focus-indicator",3,"matRippleDisabled"],[1,"mdc-slider__value-indicator"],[1,"mdc-slider__value-indicator-text"]],template:function(t,r){t&1&&(M(0,nr,5,1,"div",2),b(1,"div",3,0)(3,"div",4)),t&2&&(k(r.discrete?0:-1),m(3),T("matRippleDisabled",!0))},dependencies:[Ee],styles:[`.mat-mdc-slider-visual-thumb .mat-ripple {
  height: 100%;
  width: 100%;
}

.mat-mdc-slider .mdc-slider__tick-marks {
  justify-content: start;
}
.mat-mdc-slider .mdc-slider__tick-marks .mdc-slider__tick-mark--active,
.mat-mdc-slider .mdc-slider__tick-marks .mdc-slider__tick-mark--inactive {
  position: absolute;
  left: 2px;
}
`],encapsulation:2,changeDetection:0})}return n})(),Ni=(()=>{class n{_ngZone=f(Ue);_cdr=f(_e);_elementRef=f(ue);_dir=f(fi,{optional:!0});_globalRippleOptions=f(gi,{optional:!0});_trackActive;_thumbs;_input;_inputs;get disabled(){return this._disabled}set disabled(e){this._disabled=e;let t=this._getInput(h.END),r=this._getInput(h.START);t&&(t.disabled=this._disabled),r&&(r.disabled=this._disabled)}_disabled=!1;get discrete(){return this._discrete}set discrete(e){this._discrete=e,this._updateValueIndicatorUIs()}_discrete=!1;get showTickMarks(){return this._showTickMarks}set showTickMarks(e){this._showTickMarks=e,this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI())}_showTickMarks=!1;get min(){return this._min}set min(e){let t=e==null||isNaN(e)?this._min:e;this._min!==t&&this._updateMin(t)}_min=0;color;disableRipple=!1;_updateMin(e){let t=this._min;this._min=e,this._isRange?this._updateMinRange({old:t,new:e}):this._updateMinNonRange(e),this._onMinMaxOrStepChange()}_updateMinRange(e){let t=this._getInput(h.END),r=this._getInput(h.START),a=t.value,o=r.value;r.min=e.new,t.min=Math.max(e.new,r.value),r.max=Math.min(t.max,t.value),r._updateWidthInactive(),t._updateWidthInactive(),e.new<e.old?this._onTranslateXChangeBySideEffect(t,r):this._onTranslateXChangeBySideEffect(r,t),a!==t.value&&this._onValueChange(t),o!==r.value&&this._onValueChange(r)}_updateMinNonRange(e){let t=this._getInput(h.END);if(t){let r=t.value;t.min=e,t._updateThumbUIByValue(),this._updateTrackUI(t),r!==t.value&&this._onValueChange(t)}}get max(){return this._max}set max(e){let t=e==null||isNaN(e)?this._max:e;this._max!==t&&this._updateMax(t)}_max=100;_updateMax(e){let t=this._max;this._max=e,this._isRange?this._updateMaxRange({old:t,new:e}):this._updateMaxNonRange(e),this._onMinMaxOrStepChange()}_updateMaxRange(e){let t=this._getInput(h.END),r=this._getInput(h.START),a=t.value,o=r.value;t.max=e.new,r.max=Math.min(e.new,t.value),t.min=r.value,t._updateWidthInactive(),r._updateWidthInactive(),e.new>e.old?this._onTranslateXChangeBySideEffect(r,t):this._onTranslateXChangeBySideEffect(t,r),a!==t.value&&this._onValueChange(t),o!==r.value&&this._onValueChange(r)}_updateMaxNonRange(e){let t=this._getInput(h.END);if(t){let r=t.value;t.max=e,t._updateThumbUIByValue(),this._updateTrackUI(t),r!==t.value&&this._onValueChange(t)}}get step(){return this._step}set step(e){let t=isNaN(e)?this._step:e;this._step!==t&&this._updateStep(t)}_step=1;_updateStep(e){this._step=e,this._isRange?this._updateStepRange():this._updateStepNonRange(),this._onMinMaxOrStepChange()}_updateStepRange(){let e=this._getInput(h.END),t=this._getInput(h.START),r=e.value,a=t.value,o=t.value;e.min=this._min,t.max=this._max,e.step=this._step,t.step=this._step,this._platform.SAFARI&&(e.value=e.value,t.value=t.value),e.min=Math.max(this._min,t.value),t.max=Math.min(this._max,e.value),t._updateWidthInactive(),e._updateWidthInactive(),e.value<o?this._onTranslateXChangeBySideEffect(t,e):this._onTranslateXChangeBySideEffect(e,t),r!==e.value&&this._onValueChange(e),a!==t.value&&this._onValueChange(t)}_updateStepNonRange(){let e=this._getInput(h.END);if(e){let t=e.value;e.step=this._step,this._platform.SAFARI&&(e.value=e.value),e._updateThumbUIByValue(),t!==e.value&&this._onValueChange(e)}}displayWith=e=>`${e}`;_tickMarks;_noopAnimations=Qe();_resizeObserver=null;_cachedWidth;_cachedLeft;_rippleRadius=24;startValueIndicatorText="";endValueIndicatorText="";_endThumbTransform;_startThumbTransform;_isRange=!1;_isRtl=di(()=>this._dir?.valueSignal()==="rtl");_hasViewInitialized=!1;_tickMarkTrackWidth=0;_hasAnimation=!1;_resizeTimer=null;_platform=f(Xe);constructor(){f(Ge).load(Ke);let e=this._isRtl();mi(()=>{let t=this._isRtl();t!==e&&(e=t,this._isRange?this._onDirChangeRange():this._onDirChangeNonRange(),this._updateTickMarkUI())})}_knobRadius=8;_inputPadding;ngAfterViewInit(){this._platform.isBrowser&&this._updateDimensions();let e=this._getInput(h.END),t=this._getInput(h.START);this._isRange=!!e&&!!t,this._cdr.detectChanges();let r=this._getThumb(h.END);this._rippleRadius=r._ripple.radius,this._inputPadding=this._rippleRadius-this._knobRadius,this._isRange?this._initUIRange(e,t):this._initUINonRange(e),this._updateTrackUI(e),this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._observeHostResize(),this._cdr.detectChanges()}_initUINonRange(e){e.initProps(),e.initUI(),this._updateValueIndicatorUI(e),this._hasViewInitialized=!0,e._updateThumbUIByValue()}_initUIRange(e,t){e.initProps(),e.initUI(),t.initProps(),t.initUI(),e._updateMinMax(),t._updateMinMax(),e._updateStaticStyles(),t._updateStaticStyles(),this._updateValueIndicatorUIs(),this._hasViewInitialized=!0,e._updateThumbUIByValue(),t._updateThumbUIByValue()}ngOnDestroy(){this._resizeObserver?.disconnect(),this._resizeObserver=null}_onDirChangeRange(){let e=this._getInput(h.END),t=this._getInput(h.START);e._setIsLeftThumb(),t._setIsLeftThumb(),e.translateX=e._calcTranslateXByValue(),t.translateX=t._calcTranslateXByValue(),e._updateStaticStyles(),t._updateStaticStyles(),e._updateWidthInactive(),t._updateWidthInactive(),e._updateThumbUIByValue(),t._updateThumbUIByValue()}_onDirChangeNonRange(){this._getInput(h.END)._updateThumbUIByValue()}_observeHostResize(){typeof ResizeObserver>"u"||!ResizeObserver||this._ngZone.runOutsideAngular(()=>{this._resizeObserver=new ResizeObserver(()=>{this._isActive()||(this._resizeTimer&&clearTimeout(this._resizeTimer),this._onResize())}),this._resizeObserver.observe(this._elementRef.nativeElement)})}_isActive(){return this._getThumb(h.START)._isActive||this._getThumb(h.END)._isActive}_getValue(e=h.END){let t=this._getInput(e);return t?t.value:this.min}_skipUpdate(){return!!(this._getInput(h.START)?._skipUIUpdate||this._getInput(h.END)?._skipUIUpdate)}_updateDimensions(){this._cachedWidth=this._elementRef.nativeElement.offsetWidth,this._cachedLeft=this._elementRef.nativeElement.getBoundingClientRect().left}_setTrackActiveStyles(e){let t=this._trackActive.nativeElement.style;t.left=e.left,t.right=e.right,t.transformOrigin=e.transformOrigin,t.transform=e.transform}_calcTickMarkTransform(e){let t=e*(this._tickMarkTrackWidth/(this._tickMarks.length-1));return`translateX(${this._isRtl()?this._cachedWidth-6-t:t}px)`}_onTranslateXChange(e){this._hasViewInitialized&&(this._updateThumbUI(e),this._updateTrackUI(e),this._updateOverlappingThumbUI(e))}_onTranslateXChangeBySideEffect(e,t){this._hasViewInitialized&&(e._updateThumbUIByValue(),t._updateThumbUIByValue())}_onValueChange(e){this._hasViewInitialized&&(this._updateValueIndicatorUI(e),this._updateTickMarkUI(),this._cdr.detectChanges())}_onMinMaxOrStepChange(){this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.markForCheck())}_onResize(){if(this._hasViewInitialized){if(this._updateDimensions(),this._isRange){let e=this._getInput(h.END),t=this._getInput(h.START);e._updateThumbUIByValue(),t._updateThumbUIByValue(),e._updateStaticStyles(),t._updateStaticStyles(),e._updateMinMax(),t._updateMinMax(),e._updateWidthInactive(),t._updateWidthInactive()}else{let e=this._getInput(h.END);e&&e._updateThumbUIByValue()}this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.detectChanges()}}_thumbsOverlap=!1;_areThumbsOverlapping(){let e=this._getInput(h.START),t=this._getInput(h.END);return!e||!t?!1:t.translateX-e.translateX<20}_updateOverlappingThumbClassNames(e){let t=e.getSibling(),r=this._getThumb(e.thumbPosition);this._getThumb(t.thumbPosition)._hostElement.classList.remove("mdc-slider__thumb--top"),r._hostElement.classList.toggle("mdc-slider__thumb--top",this._thumbsOverlap)}_updateOverlappingThumbUI(e){!this._isRange||this._skipUpdate()||this._thumbsOverlap!==this._areThumbsOverlapping()&&(this._thumbsOverlap=!this._thumbsOverlap,this._updateOverlappingThumbClassNames(e))}_updateThumbUI(e){if(this._skipUpdate())return;let t=this._getThumb(e.thumbPosition===h.END?h.END:h.START);t._hostElement.style.transform=`translateX(${e.translateX}px)`}_updateValueIndicatorUI(e){if(this._skipUpdate())return;let t=this.displayWith(e.value);if(this._hasViewInitialized?e._valuetext.set(t):e._hostElement.setAttribute("aria-valuetext",t),this.discrete){e.thumbPosition===h.START?this.startValueIndicatorText=t:this.endValueIndicatorText=t;let r=this._getThumb(e.thumbPosition);t.length<3?r._hostElement.classList.add("mdc-slider__thumb--short-value"):r._hostElement.classList.remove("mdc-slider__thumb--short-value")}}_updateValueIndicatorUIs(){let e=this._getInput(h.END),t=this._getInput(h.START);e&&this._updateValueIndicatorUI(e),t&&this._updateValueIndicatorUI(t)}_updateTickMarkTrackUI(){if(!this.showTickMarks||this._skipUpdate())return;let e=this._step&&this._step>0?this._step:1,r=(Math.floor(this.max/e)*e-this.min)/(this.max-this.min);this._tickMarkTrackWidth=(this._cachedWidth-6)*r}_updateTrackUI(e){this._skipUpdate()||(this._isRange?this._updateTrackUIRange(e):this._updateTrackUINonRange(e))}_updateTrackUIRange(e){let t=e.getSibling();if(!t||!this._cachedWidth)return;let r=Math.abs(t.translateX-e.translateX)/this._cachedWidth;e._isLeftThumb&&this._cachedWidth?this._setTrackActiveStyles({left:"auto",right:`${this._cachedWidth-t.translateX}px`,transformOrigin:"right",transform:`scaleX(${r})`}):this._setTrackActiveStyles({left:`${t.translateX}px`,right:"auto",transformOrigin:"left",transform:`scaleX(${r})`})}_updateTrackUINonRange(e){this._isRtl()?this._setTrackActiveStyles({left:"auto",right:"0px",transformOrigin:"right",transform:`scaleX(${1-e.fillPercentage})`}):this._setTrackActiveStyles({left:"0px",right:"auto",transformOrigin:"left",transform:`scaleX(${e.fillPercentage})`})}_updateTickMarkUI(){if(!this.showTickMarks||this.step===void 0||this.min===void 0||this.max===void 0)return;let e=this.step>0?this.step:1;this._isRange?this._updateTickMarkUIRange(e):this._updateTickMarkUINonRange(e)}_updateTickMarkUINonRange(e){let t=this._getValue(),r=Math.max(Math.round((t-this.min)/e),0)+1,a=Math.max(Math.round((this.max-t)/e),0)-1;this._isRtl()?r++:a++,this._tickMarks=Array(r).fill(be.ACTIVE).concat(Array(a).fill(be.INACTIVE))}_updateTickMarkUIRange(e){let t=this._getValue(),r=this._getValue(h.START),a=Math.max(Math.round((r-this.min)/e),0),o=Math.max(Math.round((t-r)/e)+1,0),s=Math.max(Math.round((this.max-t)/e),0);this._tickMarks=Array(a).fill(be.INACTIVE).concat(Array(o).fill(be.ACTIVE),Array(s).fill(be.INACTIVE))}_getInput(e){if(e===h.END&&this._input)return this._input;if(this._inputs?.length)return e===h.START?this._inputs.first:this._inputs.last}_getThumb(e){return e===h.END?this._thumbs?.last:this._thumbs?.first}_setTransition(e){this._hasAnimation=!this._platform.IOS&&e&&!this._noopAnimations,this._elementRef.nativeElement.classList.toggle("mat-mdc-slider-with-animation",this._hasAnimation)}_isCursorOnSliderThumb(e,t){let r=t.width/2,a=t.x+r,o=t.y+r,s=e.clientX-a,l=e.clientY-o;return Math.pow(s,2)+Math.pow(l,2)<Math.pow(r,2)}static \u0275fac=function(t){return new(t||n)};static \u0275cmp=S({type:n,selectors:[["mat-slider"]],contentQueries:function(t,r,a){if(t&1&&ri(a,Vi,5)(a,cr,4),t&2){let o;L(o=V())&&(r._input=o.first),L(o=V())&&(r._inputs=o)}},viewQuery:function(t,r){if(t&1&&oe(rr,5)(Bi,5),t&2){let a;L(a=V())&&(r._trackActive=a.first),L(a=V())&&(r._thumbs=a)}},hostAttrs:[1,"mat-mdc-slider","mdc-slider"],hostVars:12,hostBindings:function(t,r){t&2&&(X("mat-"+(r.color||"primary")),Te("mdc-slider--range",r._isRange)("mdc-slider--disabled",r.disabled)("mdc-slider--discrete",r.discrete)("mdc-slider--tick-marks",r.showTickMarks)("_mat-animation-noopable",r._noopAnimations))},inputs:{disabled:[2,"disabled","disabled",D],discrete:[2,"discrete","discrete",D],showTickMarks:[2,"showTickMarks","showTickMarks",D],min:[2,"min","min",U],color:"color",disableRipple:[2,"disableRipple","disableRipple",D],max:[2,"max","max",U],step:[2,"step","step",U],displayWith:"displayWith"},exportAs:["matSlider"],features:[ge([{provide:xt,useExisting:n}])],ngContentSelectors:ar,decls:9,vars:5,consts:[["trackActive",""],["tickMarkContainer",""],[1,"mdc-slider__track"],[1,"mdc-slider__track--inactive"],[1,"mdc-slider__track--active"],[1,"mdc-slider__track--active_fill"],[1,"mdc-slider__tick-marks"],[3,"discrete","thumbPosition","valueIndicatorText"],[3,"class","transform"]],template:function(t,r){t&1&&(qe(),We(0),d(1,"div",2),b(2,"div",3),d(3,"div",4),b(4,"div",5,0),c(),M(6,lr,3,1,"div",6),c(),M(7,dr,1,3,"mat-slider-visual-thumb",7),b(8,"mat-slider-visual-thumb",7)),t&2&&(m(6),k(r.showTickMarks?6:-1),m(),k(r._isRange?7:-1),m(),T("discrete",r.discrete)("thumbPosition",2)("valueIndicatorText",r.endValueIndicatorText))},dependencies:[mr],styles:[`.mdc-slider__track {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  pointer-events: none;
  height: var(--mat-slider-inactive-track-height, 4px);
}

.mdc-slider__track--active,
.mdc-slider__track--inactive {
  display: flex;
  height: 100%;
  position: absolute;
  width: 100%;
}

.mdc-slider__track--active {
  overflow: hidden;
  border-radius: var(--mat-slider-active-track-shape, var(--mat-sys-corner-full));
  height: var(--mat-slider-active-track-height, 4px);
  top: calc((var(--mat-slider-inactive-track-height, 4px) - var(--mat-slider-active-track-height, 4px)) / 2);
}

.mdc-slider__track--active_fill {
  border-top-style: solid;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  position: relative;
  transform-origin: left;
  transition: transform 80ms ease;
  border-color: var(--mat-slider-active-track-color, var(--mat-sys-primary));
  border-top-width: var(--mat-slider-active-track-height, 4px);
}
.mdc-slider--disabled .mdc-slider__track--active_fill {
  border-color: var(--mat-slider-disabled-active-track-color, var(--mat-sys-on-surface));
}
[dir=rtl] .mdc-slider__track--active_fill {
  -webkit-transform-origin: right;
  transform-origin: right;
}

.mdc-slider__track--inactive {
  left: 0;
  top: 0;
  opacity: 0.24;
  background-color: var(--mat-slider-inactive-track-color, var(--mat-sys-surface-variant));
  height: var(--mat-slider-inactive-track-height, 4px);
  border-radius: var(--mat-slider-inactive-track-shape, var(--mat-sys-corner-full));
}
.mdc-slider--disabled .mdc-slider__track--inactive {
  background-color: var(--mat-slider-disabled-inactive-track-color, var(--mat-sys-on-surface));
  opacity: 0.24;
}
.mdc-slider__track--inactive::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 1px solid transparent;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}
@media (forced-colors: active) {
  .mdc-slider__track--inactive::before {
    border-color: CanvasText;
  }
}

.mdc-slider__value-indicator-container {
  bottom: 44px;
  left: 50%;
  pointer-events: none;
  position: absolute;
  transform: var(--mat-slider-value-indicator-container-transform, translateX(-50%) rotate(-45deg));
}
.mdc-slider__thumb--with-indicator .mdc-slider__value-indicator-container {
  pointer-events: auto;
}

.mdc-slider__value-indicator {
  display: flex;
  align-items: center;
  transform: scale(0);
  transform-origin: var(--mat-slider-value-indicator-transform-origin, 0 28px);
  transition: transform 100ms cubic-bezier(0.4, 0, 1, 1);
  word-break: normal;
  background-color: var(--mat-slider-label-container-color, var(--mat-sys-primary));
  color: var(--mat-slider-label-label-text-color, var(--mat-sys-on-primary));
  width: var(--mat-slider-value-indicator-width, 28px);
  height: var(--mat-slider-value-indicator-height, 28px);
  padding: var(--mat-slider-value-indicator-padding, 0);
  opacity: var(--mat-slider-value-indicator-opacity, 1);
  border-radius: var(--mat-slider-value-indicator-border-radius, 50% 50% 50% 0);
}
.mdc-slider__thumb--with-indicator .mdc-slider__value-indicator {
  transition: transform 100ms cubic-bezier(0, 0, 0.2, 1);
  transform: scale(1);
}
.mdc-slider__value-indicator::before {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid;
  bottom: -5px;
  content: "";
  height: 0;
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
  width: 0;
  display: var(--mat-slider-value-indicator-caret-display, none);
  border-top-color: var(--mat-slider-label-container-color, var(--mat-sys-primary));
}
.mdc-slider__value-indicator::after {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 1px solid transparent;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}
@media (forced-colors: active) {
  .mdc-slider__value-indicator::after {
    border-color: CanvasText;
  }
}

.mdc-slider__value-indicator-text {
  text-align: center;
  width: var(--mat-slider-value-indicator-width, 28px);
  transform: var(--mat-slider-value-indicator-text-transform, rotate(45deg));
  font-family: var(--mat-slider-label-label-text-font, var(--mat-sys-label-medium-font));
  font-size: var(--mat-slider-label-label-text-size, var(--mat-sys-label-medium-size));
  font-weight: var(--mat-slider-label-label-text-weight, var(--mat-sys-label-medium-weight));
  line-height: var(--mat-slider-label-label-text-line-height, var(--mat-sys-label-medium-line-height));
  letter-spacing: var(--mat-slider-label-label-text-tracking, var(--mat-sys-label-medium-tracking));
}

.mdc-slider__thumb {
  -webkit-user-select: none;
  user-select: none;
  display: flex;
  left: -24px;
  outline: none;
  position: absolute;
  height: 48px;
  width: 48px;
  pointer-events: none;
}
.mdc-slider--discrete .mdc-slider__thumb {
  transition: transform 80ms ease;
}
.mdc-slider--disabled .mdc-slider__thumb {
  pointer-events: none;
}

.mdc-slider__thumb--top {
  z-index: 1;
}

.mdc-slider__thumb-knob {
  position: absolute;
  box-sizing: border-box;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-style: solid;
  width: var(--mat-slider-handle-width, 20px);
  height: var(--mat-slider-handle-height, 20px);
  border-width: calc(var(--mat-slider-handle-height, 20px) / 2) calc(var(--mat-slider-handle-width, 20px) / 2);
  box-shadow: var(--mat-slider-handle-elevation, var(--mat-sys-level1));
  background-color: var(--mat-slider-handle-color, var(--mat-sys-primary));
  border-color: var(--mat-slider-handle-color, var(--mat-sys-primary));
  border-radius: var(--mat-slider-handle-shape, var(--mat-sys-corner-full));
}
.mdc-slider__thumb:hover .mdc-slider__thumb-knob {
  background-color: var(--mat-slider-hover-handle-color, var(--mat-sys-primary));
  border-color: var(--mat-slider-hover-handle-color, var(--mat-sys-primary));
}
.mdc-slider__thumb--focused .mdc-slider__thumb-knob {
  background-color: var(--mat-slider-focus-handle-color, var(--mat-sys-primary));
  border-color: var(--mat-slider-focus-handle-color, var(--mat-sys-primary));
}
.mdc-slider--disabled .mdc-slider__thumb-knob {
  background-color: var(--mat-slider-disabled-handle-color, var(--mat-sys-on-surface));
  border-color: var(--mat-slider-disabled-handle-color, var(--mat-sys-on-surface));
}
.mdc-slider__thumb--top .mdc-slider__thumb-knob, .mdc-slider__thumb--top.mdc-slider__thumb:hover .mdc-slider__thumb-knob, .mdc-slider__thumb--top.mdc-slider__thumb--focused .mdc-slider__thumb-knob {
  border: solid 1px #fff;
  box-sizing: content-box;
  border-color: var(--mat-slider-with-overlap-handle-outline-color, var(--mat-sys-on-primary));
  border-width: var(--mat-slider-with-overlap-handle-outline-width, 1px);
}

.mdc-slider__tick-marks {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  height: 100%;
  justify-content: space-between;
  padding: 0 1px;
  position: absolute;
  width: 100%;
}

.mdc-slider__tick-mark--active,
.mdc-slider__tick-mark--inactive {
  width: var(--mat-slider-with-tick-marks-container-size, 2px);
  height: var(--mat-slider-with-tick-marks-container-size, 2px);
  border-radius: var(--mat-slider-with-tick-marks-container-shape, var(--mat-sys-corner-full));
}

.mdc-slider__tick-mark--inactive {
  opacity: var(--mat-slider-with-tick-marks-inactive-container-opacity, 0.38);
  background-color: var(--mat-slider-with-tick-marks-inactive-container-color, var(--mat-sys-on-surface-variant));
}
.mdc-slider--disabled .mdc-slider__tick-mark--inactive {
  opacity: var(--mat-slider-with-tick-marks-inactive-container-opacity, 0.38);
  background-color: var(--mat-slider-with-tick-marks-disabled-container-color, var(--mat-sys-on-surface));
}

.mdc-slider__tick-mark--active {
  opacity: var(--mat-slider-with-tick-marks-active-container-opacity, 0.38);
  background-color: var(--mat-slider-with-tick-marks-active-container-color, var(--mat-sys-on-primary));
}

.mdc-slider__input {
  cursor: pointer;
  left: 2px;
  margin: 0;
  height: 44px;
  opacity: 0;
  position: absolute;
  top: 2px;
  width: 44px;
  box-sizing: content-box;
}
.mdc-slider__input.mat-mdc-slider-input-no-pointer-events {
  pointer-events: none;
}
.mdc-slider__input.mat-slider__right-input {
  left: auto;
  right: 0;
}

.mat-mdc-slider {
  display: inline-block;
  box-sizing: border-box;
  outline: none;
  vertical-align: middle;
  cursor: pointer;
  height: 48px;
  margin: 0 8px;
  position: relative;
  touch-action: pan-y;
  width: auto;
  min-width: 112px;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-slider.mdc-slider--disabled {
  cursor: auto;
  opacity: 0.38;
}
.mat-mdc-slider.mdc-slider--disabled .mdc-slider__input {
  cursor: auto;
}
.mat-mdc-slider .mdc-slider__thumb,
.mat-mdc-slider .mdc-slider__track--active_fill {
  transition-duration: 0ms;
}
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__thumb,
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__track--active_fill {
  transition-duration: 80ms;
}
.mat-mdc-slider.mdc-slider--discrete .mdc-slider__thumb,
.mat-mdc-slider.mdc-slider--discrete .mdc-slider__track--active_fill {
  transition-duration: 0ms;
}
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__thumb,
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__track--active_fill {
  transition-duration: 80ms;
}
.mat-mdc-slider .mat-ripple .mat-ripple-element {
  background-color: var(--mat-slider-ripple-color, var(--mat-sys-primary));
}
.mat-mdc-slider .mat-ripple .mat-mdc-slider-hover-ripple {
  background-color: var(--mat-slider-hover-state-layer-color, color-mix(in srgb, var(--mat-sys-primary) 5%, transparent));
}
.mat-mdc-slider .mat-ripple .mat-mdc-slider-focus-ripple,
.mat-mdc-slider .mat-ripple .mat-mdc-slider-active-ripple {
  background-color: var(--mat-slider-focus-state-layer-color, color-mix(in srgb, var(--mat-sys-primary) 20%, transparent));
}
.mat-mdc-slider._mat-animation-noopable.mdc-slider--discrete .mdc-slider__thumb, .mat-mdc-slider._mat-animation-noopable.mdc-slider--discrete .mdc-slider__track--active_fill,
.mat-mdc-slider._mat-animation-noopable .mdc-slider__value-indicator {
  transition: none;
}
.mat-mdc-slider .mat-focus-indicator::before {
  border-radius: 50%;
}

.mdc-slider__thumb--focused .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2,changeDetection:0})}return n})();var hr={provide:Ye,useExisting:Be(()=>Mt),multi:!0};var Mt=(()=>{class n{_ngZone=f(Ue);_elementRef=f(ue);_cdr=f(_e);_slider=f(xt);_platform=f(Xe);_listenerCleanups;get value(){return U(this._hostElement.value,0)}set value(e){e===null&&(e=this._getDefaultValue()),e=isNaN(e)?0:e;let t=e+"";if(!this._hasSetInitialValue){this._initialValue=t;return}this._isActive||this._setValue(t)}_setValue(e){this._hostElement.value=e,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges(),this._slider._cdr.markForCheck()}valueChange=new O;dragStart=new O;dragEnd=new O;get translateX(){return this._slider.min>=this._slider.max?(this._translateX=this._tickMarkOffset,this._translateX):(this._translateX===void 0&&(this._translateX=this._calcTranslateXByValue()),this._translateX)}set translateX(e){this._translateX=e}_translateX;thumbPosition=h.END;get min(){return U(this._hostElement.min,0)}set min(e){this._hostElement.min=e+"",this._cdr.detectChanges()}get max(){return U(this._hostElement.max,0)}set max(e){this._hostElement.max=e+"",this._cdr.detectChanges()}get step(){return U(this._hostElement.step,0)}set step(e){this._hostElement.step=e+"",this._cdr.detectChanges()}get disabled(){return D(this._hostElement.disabled)}set disabled(e){this._hostElement.disabled=e,this._cdr.detectChanges(),this._slider.disabled!==this.disabled&&(this._slider.disabled=this.disabled)}get percentage(){return this._slider.min>=this._slider.max?this._slider._isRtl()?1:0:(this.value-this._slider.min)/(this._slider.max-this._slider.min)}get fillPercentage(){return this._slider._cachedWidth?this._translateX===0?0:this.translateX/this._slider._cachedWidth:this._slider._isRtl()?1:0}_hostElement=this._elementRef.nativeElement;_valuetext=Zt("");_knobRadius=8;_tickMarkOffset=3;_isActive=!1;_isFocused=!1;_setIsFocused(e){this._isFocused=e}_hasSetInitialValue=!1;_initialValue;_formControl;_destroyed=new Jt;_skipUIUpdate=!1;_onChangeFn;_onTouchedFn=()=>{};_isControlInitialized=!1;constructor(){let e=f(ke);this._ngZone.runOutsideAngular(()=>{this._listenerCleanups=[e.listen(this._hostElement,"pointerdown",this._onPointerDown.bind(this)),e.listen(this._hostElement,"pointermove",this._onPointerMove.bind(this)),e.listen(this._hostElement,"pointerup",this._onPointerUp.bind(this))]})}ngOnDestroy(){this._listenerCleanups.forEach(e=>e()),this._destroyed.next(),this._destroyed.complete(),this.dragStart.complete(),this.dragEnd.complete()}initProps(){this._updateWidthInactive(),this.disabled!==this._slider.disabled&&(this._slider.disabled=!0),this.step=this._slider.step,this.min=this._slider.min,this.max=this._slider.max,this._initValue()}initUI(){this._updateThumbUIByValue()}_initValue(){this._hasSetInitialValue=!0,this._initialValue===void 0?this.value=this._getDefaultValue():(this._hostElement.value=this._initialValue,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges())}_getDefaultValue(){return this.min}_onBlur(){this._setIsFocused(!1),this._onTouchedFn()}_onFocus(){this._slider._setTransition(!1),this._slider._updateTrackUI(this),this._setIsFocused(!0)}_onChange(){this.valueChange.emit(this.value),this._isActive&&this._updateThumbUIByValue({withAnimation:!0})}_onInput(){this._onChangeFn?.(this.value),(this._slider.step||!this._isActive)&&this._updateThumbUIByValue({withAnimation:!0}),this._slider._onValueChange(this)}_onNgControlValueChange(){(!this._isActive||!this._isFocused)&&(this._slider._onValueChange(this),this._updateThumbUIByValue()),this._slider.disabled=this._formControl.disabled}_onPointerDown(e){if(!(this.disabled||e.button!==0)){if(this._platform.IOS){let t=this._slider._isCursorOnSliderThumb(e,this._slider._getThumb(this.thumbPosition)._hostElement.getBoundingClientRect());this._isActive=t,this._updateWidthActive(),this._slider._updateDimensions();return}this._isActive=!0,this._setIsFocused(!0),this._updateWidthActive(),this._slider._updateDimensions(),this._slider.step||this._updateThumbUIByPointerEvent(e,{withAnimation:!0}),this.disabled||(this._handleValueCorrection(e),this.dragStart.emit({source:this,parent:this._slider,value:this.value}))}}_handleValueCorrection(e){this._skipUIUpdate=!0,setTimeout(()=>{this._skipUIUpdate=!1,this._fixValue(e)},0)}_fixValue(e){let t=e.clientX-this._slider._cachedLeft,r=this._slider._cachedWidth,a=this._slider.step===0?1:this._slider.step,o=Math.floor((this._slider.max-this._slider.min)/a),s=this._slider._isRtl()?1-t/r:t/r,u=Math.round(s*o)/o*(this._slider.max-this._slider.min)+this._slider.min,p=Math.round(u/a)*a,x=this.value;if(p===x){this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(e,{withAnimation:this._slider._hasAnimation});return}this.value=p,this.valueChange.emit(this.value),this._onChangeFn?.(this.value),this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(e,{withAnimation:this._slider._hasAnimation})}_onPointerMove(e){!this._slider.step&&this._isActive&&this._updateThumbUIByPointerEvent(e)}_onPointerUp(){this._isActive&&(this._isActive=!1,this._platform.SAFARI&&this._setIsFocused(!1),this.dragEnd.emit({source:this,parent:this._slider,value:this.value}),setTimeout(()=>this._updateWidthInactive(),this._platform.IOS?10:0))}_clamp(e){let t=this._tickMarkOffset,r=this._slider._cachedWidth-this._tickMarkOffset;return Math.max(Math.min(e,r),t)}_calcTranslateXByValue(){return this._slider._isRtl()?(1-this.percentage)*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset:this.percentage*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset}_calcTranslateXByPointerEvent(e){return e.clientX-this._slider._cachedLeft}_updateWidthActive(){}_updateWidthInactive(){this._hostElement.style.padding=`0 ${this._slider._inputPadding}px`,this._hostElement.style.width=`calc(100% + ${this._slider._inputPadding-this._tickMarkOffset*2}px)`,this._hostElement.style.left=`-${this._slider._rippleRadius-this._tickMarkOffset}px`}_updateThumbUIByValue(e){this.translateX=this._clamp(this._calcTranslateXByValue()),this._updateThumbUI(e)}_updateThumbUIByPointerEvent(e,t){this.translateX=this._clamp(this._calcTranslateXByPointerEvent(e)),this._updateThumbUI(t)}_updateThumbUI(e){this._slider._setTransition(!!e?.withAnimation),this._slider._onTranslateXChange(this)}writeValue(e){(this._isControlInitialized||e!==null)&&(this.value=e)}registerOnChange(e){this._onChangeFn=e,this._isControlInitialized=!0}registerOnTouched(e){this._onTouchedFn=e}setDisabledState(e){this.disabled=e}focus(){this._hostElement.focus()}blur(){this._hostElement.blur()}static \u0275fac=function(t){return new(t||n)};static \u0275dir=ei({type:n,selectors:[["input","matSliderThumb",""]],hostAttrs:["type","range",1,"mdc-slider__input"],hostVars:1,hostBindings:function(t,r){t&1&&P("change",function(){return r._onChange()})("input",function(){return r._onInput()})("blur",function(){return r._onBlur()})("focus",function(){return r._onFocus()}),t&2&&pe("aria-valuetext",r._valuetext())},inputs:{value:[2,"value","value",U]},outputs:{valueChange:"valueChange",dragStart:"dragStart",dragEnd:"dragEnd"},exportAs:["matSliderThumb"],features:[ge([hr,{provide:Vi,useExisting:n}])]})}return n})();var Ui=(()=>{class n{static \u0275fac=function(t){return new(t||n)};static \u0275mod=ze({type:n});static \u0275inj=Ne({imports:[bi,$e]})}return n})();var qi=()=>({showLarger:!0});function pr(n,i){if(n&1){let e=A();d(0,"h1"),g(1,"Souhaitez-vous conserver les m\xEAmes param\xE8tres ?"),c(),d(2,"div",1)(3,"button",2),P("click",function(){E(e);let r=_();return R(r.startAgainMode=!1)}),b(4,"i",3),d(5,"span",4),g(6,"Non"),c()(),d(7,"button",5),P("click",function(){E(e);let r=_();return R(r.keepSameSettingsConfirm())}),b(8,"i",6),d(9,"span",4),g(10,"Oui"),c()()()}}function gr(n,i){if(n&1&&(d(0,"mat-option",10)(1,"div",13),b(2,"i"),d(3,"span",14),g(4),c()()()),n&2){let e=i.$implicit;T("value",e.key),m(2),X(e.icon),m(2),N(e.label)}}function _r(n,i){if(n&1){let e=A();d(0,"span",8),g(1,"Taille du mot de d\xE9part"),c(),d(2,"mat-slider",21)(3,"input",17),W("ngModelChange",function(r){E(e);let a=_(3);return q(a.startWordLength,r)||(a.startWordLength=r),R(r)}),c()()}if(n&2){let e=_(3);m(2),T("max",e.maxWordLength),m(),z("ngModel",e.startWordLength)}}function fr(n,i){if(n&1){let e=A();d(0,"span",8),g(1,"Filtre par continent"),c(),d(2,"mat-slider",22)(3,"input",17),W("ngModelChange",function(r){E(e);let a=_(3);return q(a.categoryFilter,r)||(a.categoryFilter=r),R(r)}),c()()}if(n&2){let e=_(3);m(2),T("displayWith",e.formatLabelContinent)("ngClass",bt(3,qi)),m(),z("ngModel",e.categoryFilter)}}function br(n,i){if(n&1){let e=A();d(0,"span",8),g(1,"Filtre par cat\xE9gorie"),c(),d(2,"mat-slider",23)(3,"input",17),W("ngModelChange",function(r){E(e);let a=_(3);return q(a.categoryFilter,r)||(a.categoryFilter=r),R(r)}),c()()}if(n&2){let e=_(3);m(2),T("displayWith",e.formatLabelMarques)("ngClass",bt(3,qi)),m(),z("ngModel",e.categoryFilter)}}function vr(n,i){if(n&1){let e=A();d(0,"mat-slide-toggle",24),W("ngModelChange",function(r){E(e);let a=_(3);return q(a.isWordLengthIncreasing,r)||(a.isWordLengthIncreasing=r),R(r)}),g(1," Croissance progressive "),c(),d(2,"mat-slide-toggle",24),W("ngModelChange",function(r){E(e);let a=_(3);return q(a.showFirstLetterMotus,r)||(a.showFirstLetterMotus=r),R(r)}),g(3," Afficher 1"),d(4,"sup"),g(5,"\xE8re"),c(),g(6," lettre "),c()}if(n&2){let e=_(3);z("ngModel",e.isWordLengthIncreasing),m(2),z("ngModel",e.showFirstLetterMotus)}}function yr(n,i){if(n&1){let e=A();d(0,"mat-slide-toggle",24),W("ngModelChange",function(r){E(e);let a=_(3);return q(a.showFirstLetterDrapeaux,r)||(a.showFirstLetterDrapeaux=r),R(r)}),g(1," Afficher 1"),d(2,"sup"),g(3,"\xE8re"),c(),g(4," lettre "),c()}if(n&2){let e=_(3);z("ngModel",e.showFirstLetterDrapeaux)}}function wr(n,i){if(n&1){let e=A();d(0,"mat-slide-toggle",24),W("ngModelChange",function(r){E(e);let a=_(3);return q(a.showFirstLetterMarques,r)||(a.showFirstLetterMarques=r),R(r)}),g(1," Afficher 1"),d(2,"sup"),g(3,"\xE8re"),c(),g(4," lettre "),c()}if(n&2){let e=_(3);z("ngModel",e.showFirstLetterMarques)}}function Cr(n,i){if(n&1){let e=A();d(0,"div",15)(1,"span",8),g(2,"Nombre de manches"),c(),d(3,"mat-slider",16)(4,"input",17),W("ngModelChange",function(r){E(e);let a=_(2);return q(a.stepsNumber,r)||(a.stepsNumber=r),R(r)}),c()()(),d(5,"div",18),M(6,_r,4,2)(7,fr,4,4)(8,br,4,4),c(),d(9,"div",19),M(10,vr,7,2)(11,yr,5,1,"mat-slide-toggle",20)(12,wr,5,1,"mat-slide-toggle",20),c()}if(n&2){let e=_(2);m(4),z("ngModel",e.stepsNumber),m(2),k(e.gameSelected===e.motusGameKey?6:e.gameSelected===e.drapeauxGameKey?7:e.gameSelected===e.marquesGameKey?8:-1),m(4),k(e.gameSelected===e.motusGameKey?10:e.gameSelected===e.drapeauxGameKey?11:e.gameSelected===e.marquesGameKey?12:-1)}}function xr(n,i){if(n&1){let e=A();d(0,"h1"),g(1,"Veuillez configurer la room"),c(),d(2,"div",7)(3,"span",8),g(4,"Jeu"),c(),d(5,"mat-form-field")(6,"mat-select",9),W("ngModelChange",function(r){E(e);let a=_();return q(a.gameSelected,r)||(a.gameSelected=r),R(r)}),J(7,gr,5,4,"mat-option",10,$),c()()(),M(9,Cr,13,3),d(10,"div",1)(11,"button",11),P("click",function(){E(e);let r=_();return R(r.cancel())}),b(12,"i",3),d(13,"span",4),g(14,"Annuler"),c()(),d(15,"button",12),P("click",function(){E(e);let r=_();return R(r.confirm())}),b(16,"i",6),d(17,"span",4),g(18,"Valider"),c()()()}if(n&2){let e=_();m(6),z("ngModel",e.gameSelected),m(),Y(e.games),m(2),k(e.gameSelected?9:-1)}}var Fi=class n{dialogRef=f(Ze);data=f(et);games=yi;stepsNumber=3;startWordLength=5;categoryFilter="1";isWordLengthIncreasing=!0;showFirstLetterMotus=!0;showFirstLetterDrapeaux=!1;showFirstLetterMarques=!1;motusGameKey=Je.motus.key;drapeauxGameKey=Je.drapeaux.key;marquesGameKey=Je.marques.key;gameSelected=this.drapeauxGameKey;startAgainMode=!1;get maxWordLength(){return this.isWordLengthIncreasing?13-(this.stepsNumber-1):13}ngOnInit(){this.data&&(this.startAgainMode=!!this.data.startAgainMode,this.startAgainMode&&(this.stepsNumber=this.data.stepsNumber??3,this.startWordLength=this.data.startWordLength??5,this.categoryFilter=this.data.categoryFilter?.toString()??"1",this.isWordLengthIncreasing=this.data.isWordLengthIncreasing??!0,this.showFirstLetterMotus=this.data.showFirstLetterMotus??!0,this.showFirstLetterDrapeaux=this.data.showFirstLetterDrapeaux??!1,this.showFirstLetterMarques=this.data.showFirstLetterMarques??!1,this.gameSelected=this.data.gameSelected??this.drapeauxGameKey))}formatLabelContinent(i){return wt[i]??wt[1]}formatLabelMarques(i){return yt[i]??yt[1]}cancel(){this.dialogRef.close(void 0)}confirm(){this.dialogRef.close({gameSelected:this.gameSelected,showFirstLetterMotus:this.showFirstLetterMotus,showFirstLetterDrapeaux:this.showFirstLetterDrapeaux,showFirstLetterMarques:this.showFirstLetterMarques,stepsNumber:this.stepsNumber,isWordLengthIncreasing:this.isWordLengthIncreasing,startWordLength:this.startWordLength,categoryFilter:Number(this.categoryFilter)})}keepSameSettingsConfirm(){this.dialogRef.close({})}static \u0275fac=function(e){return new(e||n)};static \u0275cmp=S({type:n,selectors:[["app-add-room-dialog"]],decls:3,vars:1,consts:[["mat-dialog-content",""],[1,"button-container"],["type","button","title","Non",1,"delete",3,"click"],[1,"bx","bx-x"],[1,"text"],["type","button","title","Oui",3,"click"],[1,"bx","bx-check"],[1,"games"],[1,"description"],["name","game",1,"cap",3,"ngModelChange","ngModel"],[1,"cap-option",3,"value"],["type","button","title","Annuler",1,"delete",3,"click"],["type","button","title","Valider",3,"click"],[1,"flex"],[1,"game"],[1,"slider-container","top"],["min","1","max","8","step","1","discrete",""],["matSliderThumb","",3,"ngModelChange","ngModel"],[1,"slider-container","top2"],[1,"toggle-container","dialog"],[3,"ngModel"],["min","5","step","1","discrete","",3,"max"],["min","1","max","6","step","1","discrete","",3,"displayWith","ngClass"],["min","1","max","5","step","1","discrete","",3,"displayWith","ngClass"],[3,"ngModelChange","ngModel"]],template:function(e,t){e&1&&(d(0,"section",0),M(1,pr,11,0)(2,xr,19,2),c()),e&2&&(m(),k(t.startAgainMode?1:2))},dependencies:[ee,fe,Ui,Ni,Mt,Ri,ki,Ii,Ei,Li,Ct,Si,Pi,Ai,Di,Oi,_i],styles:["section[_ngcontent-%COMP%]{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--primary);padding:10px;border-radius:var(--light-radius);display:flex;align-items:center;justify-content:space-between;flex-direction:column;max-width:700px;width:90%}.games[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;flex-direction:column;width:300px}.games.top[_ngcontent-%COMP%]{margin-top:40px}mat-form-field[_ngcontent-%COMP%]{width:100%}  .mat-mdc-form-field-subscript-wrapper{display:none}.cap-option[_ngcontent-%COMP%]{text-transform:capitalize}.flex[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:32px;color:var(--accent)}.game[_ngcontent-%COMP%]{font-size:20px;font-weight:500;font-family:Roboto,Helvetica Neue,sans-serif;color:var(--accent)}.flex[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;gap:10px}section[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{font-size:20px;color:var(--accent);text-align:center}.button-container[_ngcontent-%COMP%]{display:flex;justify-content:space-evenly;align-items:center;width:100%;margin-top:20px;gap:10px;flex-wrap:wrap}.button-container.margin[_ngcontent-%COMP%]{margin-top:10px}.button-container[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]{cursor:pointer;color:var(--accent);padding:5px;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:var(--light-radius);transition:.5s ease;width:160px;border:none;background-color:var(--primary)}.button-container[_ngcontent-%COMP%]   button.active[_ngcontent-%COMP%]{background-color:var(--accent);color:var(--primary);cursor:default}section[_ngcontent-%COMP%]   .button-container[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]{color:red;transition:.5s ease}section[_ngcontent-%COMP%]   .button-container[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover{background-color:var(--accent);color:var(--primary)}section[_ngcontent-%COMP%]   .button-container[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]:hover{background-color:red}section[_ngcontent-%COMP%]   .button-container[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:40px}section[_ngcontent-%COMP%]   .button-container[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]   .text[_ngcontent-%COMP%]{font-size:20px;font-weight:500;font-family:Roboto,Helvetica Neue,sans-serif}.slider-container[_ngcontent-%COMP%]{margin-top:20px;display:flex;justify-content:center;align-items:center;flex-direction:column;margin-bottom:-30px;width:100%}.slider-container.top[_ngcontent-%COMP%]{margin-top:20px}.slider-container.top2[_ngcontent-%COMP%]{margin-top:30px}.slider-container[_ngcontent-%COMP%]   mat-slider[_ngcontent-%COMP%]{width:80%;max-width:300px}.description[_ngcontent-%COMP%]{font-size:20px;font-weight:500;color:var(--secondary)}.toggle-container[_ngcontent-%COMP%]{margin-top:40px;margin-bottom:10px;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:20px;width:95%}mat-slide-toggle[_ngcontent-%COMP%]{width:100%;max-width:320px}  .mdc-slider__track--active_fill{border-color:var(--accent)!important}  .mdc-slider__track--inactive{background-color:#ddd!important;opacity:1!important}  .mdc-slider__thumb-knob{background-color:var(--accent)!important;border-color:var(--accent)!important}  .mdc-slider__value-indicator{background-color:var(--accent)!important}  .toggle-container.dialog .mat-mdc-slide-toggle .mat-internal-form-field{display:flex;justify-content:space-between;align-items:center;width:100%}  .toggle-container.dialog .mat-mdc-slide-toggle .mdc-switch:enabled+.mdc-label{font-size:20px;font-weight:500;color:var(--secondary);text-align:left;margin:0;width:250px}  .mdc-switch__track:after{background:var(--accent)!important}  .mdc-switch--selected:enabled .mdc-switch__handle:after{background:var(--primary)!important}  .mdc-switch--selected .mdc-switch__icon{fill:var(--accent)!important}  .mdc-switch__track:before{background:var(--primary)!important}  .mdc-switch--unselected .mdc-switch__icon{fill:var(--primary)!important}  .showLarger .mdc-slider__value-indicator-container{transform:none!important;left:-25%!important}  .showLarger .mdc-slider__value-indicator{width:70px!important;border-radius:var(--light-radius)!important}  .showLarger .mdc-slider__value-indicator-text{transform:none!important;width:70px!important}  .mat-mdc-select-panel{background-color:var(--primary)!important}  .mat-mdc-select{color:var(--accent)!important}  .mat-mdc-select-arrow svg{fill:var(--accent)!important}  .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-multiple){background-color:var(--accent)!important}  .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-multiple) .mdc-list-item__primary-text{color:var(--primary)!important}  .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-multiple) .mdc-list-item__primary-text .flex i{color:var(--primary)!important}  .mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-multiple) .mdc-list-item__primary-text .flex .game{color:var(--primary)!important}  .mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-checked:after, .mat-pseudo-checkbox-minimal.mat-pseudo-checkbox-indeterminate[_ngcontent-%COMP%]:after{color:var(--primary)!important}  .mdc-text-field--filled:not(.mdc-text-field--disabled){background-color:var(--primary)!important}  .mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-line-ripple:before{border-bottom-color:var(--accent)!important}  .mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-line-ripple:after{border-bottom-color:var(--accent)!important}  .mdc-text-field{border-radius:var(--light-radius)!important}  .mat-mdc-select-value{font-size:20px;font-weight:500;font-family:Roboto,Helvetica Neue,sans-serif}"]})};var Me=Kn(Wn(),1);var fa=["qrcElement"],Hn=(()=>{class n{allowEmptyString=!1;colorDark="#000000ff";colorLight="#ffffffff";cssClass="qrcode";elementType="canvas";errorCorrectionLevel="M";imageSrc;imageHeight;imageWidth;margin=4;qrdata="";scale=4;version;width=10;alt;ariaLabel;title;qrCodeURL=new O;qrcElement;context=null;centerImage;renderer=f(ke);sanitizer=f(hi);ngOnChanges(){return ft(this,null,function*(){yield this.createQRCode()})}isValidQrCodeText(e){return this.allowEmptyString===!1?!(typeof e>"u"||e===""||e==="null"||e===null):!(typeof e>"u")}toDataURL(e){return new Promise((t,r)=>{(0,Me.toDataURL)(this.qrdata,e,(a,o)=>{a?r(a):t(o)})})}toCanvas(e,t){return new Promise((r,a)=>{(0,Me.toCanvas)(e,this.qrdata,t,o=>{o?a(o):r("success")})})}toSVG(e){return new Promise((t,r)=>{(0,Me.toString)(this.qrdata,e,(a,o)=>{a?r(a):t(o)})})}renderElement(e){for(let t of this.qrcElement.nativeElement.childNodes)this.renderer.removeChild(this.qrcElement.nativeElement,t);this.renderer.appendChild(this.qrcElement.nativeElement,e)}createQRCode(){return ft(this,null,function*(){this.version&&this.version>40?(console.warn("[angularx-qrcode] max value for `version` is 40"),this.version=40):this.version&&this.version<1?(console.warn("[angularx-qrcode]`min value for `version` is 1"),this.version=1):this.version!==void 0&&isNaN(this.version)&&(console.warn("[angularx-qrcode] version should be a number, defaulting to auto."),this.version=void 0);try{if(!this.isValidQrCodeText(this.qrdata))throw new Error("[angularx-qrcode] Field `qrdata` is empty, set 'allowEmptyString=\"true\"' to overwrite this behaviour.");this.isValidQrCodeText(this.qrdata)&&this.qrdata===""&&(this.qrdata=" ");let e={color:{dark:this.colorDark,light:this.colorLight},errorCorrectionLevel:this.errorCorrectionLevel,margin:this.margin,scale:this.scale,version:this.version,width:this.width},t=this.imageSrc,r=this.imageHeight?+this.imageHeight:40,a=this.imageWidth?+this.imageWidth:40;switch(this.elementType){case"canvas":{let o=this.renderer.createElement("canvas");this.context=o.getContext("2d"),this.toCanvas(o,e).then(()=>{if(this.ariaLabel&&this.renderer.setAttribute(o,"aria-label",`${this.ariaLabel}`),this.title&&this.renderer.setAttribute(o,"title",`${this.title}`),t&&this.context){this.centerImage=new Image(a,r),t!==this.centerImage.src&&(this.centerImage.crossOrigin="anonymous",this.centerImage.src=t),r!==this.centerImage.height&&(this.centerImage.height=r),a!==this.centerImage.width&&(this.centerImage.width=a);let s=this.centerImage;s&&(s.onload=()=>{this.context?.drawImage(s,o.width/2-a/2,o.height/2-r/2,a,r)})}this.renderElement(o),this.emitQRCodeURL(o)}).catch(s=>{console.error("[angularx-qrcode] canvas error:",s)});break}case"svg":{let o=this.renderer.createElement("div");this.toSVG(e).then(s=>{this.renderer.setProperty(o,"innerHTML",s);let l=o.firstChild;this.renderer.setAttribute(l,"height",`${this.width}`),this.renderer.setAttribute(l,"width",`${this.width}`),this.renderElement(l),this.emitQRCodeURL(l)}).catch(s=>{console.error("[angularx-qrcode] svg error:",s)});break}default:{let o=this.renderer.createElement("img");this.toDataURL(e).then(s=>{this.alt&&o.setAttribute("alt",this.alt),this.ariaLabel&&o.setAttribute("aria-label",this.ariaLabel),o.setAttribute("src",s),this.title&&o.setAttribute("title",this.title),this.renderElement(o),this.emitQRCodeURL(o)}).catch(s=>{console.error("[angularx-qrcode] img/url error:",s)})}}}catch(e){console.error("[angularx-qrcode] Error generating QR Code:",e.message)}})}convertBase64ImageUrlToBlob(e){let t=e.split(";base64,"),r=t[0].split(":")[1],a=atob(t[1]),o=new Uint8Array(a.length);for(let s=0;s<a.length;++s)o[s]=a.charCodeAt(s);return new Blob([o],{type:r})}emitQRCodeURL(e){let t=e.constructor.name;if(t===SVGSVGElement.name){let l=e.outerHTML,u=new Blob([l],{type:"image/svg+xml"}),p=URL.createObjectURL(u),x=this.sanitizer.bypassSecurityTrustUrl(p);this.qrCodeURL.emit(x);return}let r="";t===HTMLCanvasElement.name&&(r=e.toDataURL("image/png")),t===HTMLImageElement.name&&(r=e.src);let a=this.convertBase64ImageUrlToBlob(r),o=URL.createObjectURL(a),s=this.sanitizer.bypassSecurityTrustUrl(o);this.qrCodeURL.emit(s)}static \u0275fac=function(t){return new(t||n)};static \u0275cmp=S({type:n,selectors:[["qrcode"]],viewQuery:function(t,r){if(t&1&&oe(fa,7),t&2){let a;L(a=V())&&(r.qrcElement=a.first)}},inputs:{allowEmptyString:"allowEmptyString",colorDark:"colorDark",colorLight:"colorLight",cssClass:"cssClass",elementType:"elementType",errorCorrectionLevel:"errorCorrectionLevel",imageSrc:"imageSrc",imageHeight:"imageHeight",imageWidth:"imageWidth",margin:"margin",qrdata:"qrdata",scale:"scale",version:"version",width:"width",alt:"alt",ariaLabel:"ariaLabel",title:"title"},outputs:{qrCodeURL:"qrCodeURL"},features:[Fe],decls:2,vars:2,consts:[["qrcElement",""]],template:function(t,r){t&1&&ii(0,"div",null,0),t&2&&X(r.cssClass)},encapsulation:2,changeDetection:0})}return n})();var jn=class n{toastrHelper=f(xi);dialogRef=f(Ze);data=f(et);roomCode="";link="";ngOnInit(){this.data&&(this.roomCode=this.data),this.link=window.location.href.replace("/admin/","/room/")}copyCode(){navigator.clipboard.writeText(this.roomCode).then(()=>{this.toastrHelper.info("Code de la partie copi\xE9","Code")})}copyLink(){navigator.clipboard.writeText(this.link).then(()=>{this.toastrHelper.info("Lien de la partie copi\xE9","Lien")})}cancel(){this.dialogRef.close(void 0)}static \u0275fac=function(e){return new(e||n)};static \u0275cmp=S({type:n,selectors:[["app-multiplayer-dialog"]],decls:25,vars:6,consts:[["mat-dialog-content",""],[1,"content"],[1,"element"],[1,"title"],[1,"code"],["type","button","title","Copier code",1,"share",3,"click"],[1,"bx","bxs-copy-alt"],["type","button","title","Copier url",1,"share",3,"click"],[1,"bx","bx-link"],[1,"element","qr-code"],[3,"qrdata","width","errorCorrectionLevel","colorDark","colorLight"],[1,"button-container"],["type","button","title","Fermer",1,"delete",3,"click"],[1,"bx","bx-x"],[1,"text"]],template:function(e,t){e&1&&(d(0,"section",0)(1,"h1"),g(2,"Vous pouvez jouer en multijoueur en partageant"),c(),d(3,"div",1)(4,"div",2)(5,"span",3),g(6,"Ce code : "),d(7,"span",4),g(8),c()(),d(9,"button",5),P("click",function(){return t.copyCode()}),b(10,"i",6),c()(),d(11,"div",2)(12,"span",3),g(13,"Ou l'url :"),c(),d(14,"button",7),P("click",function(){return t.copyLink()}),b(15,"i",8),c()(),d(16,"div",9)(17,"span",3),g(18,"Ou le QR code :"),c(),b(19,"qrcode",10),c()(),d(20,"div",11)(21,"button",12),P("click",function(){return t.cancel()}),b(22,"i",13),d(23,"span",14),g(24,"Fermer"),c()()()()),e&2&&(m(8),N(t.roomCode),m(11),T("qrdata",t.link)("width",200)("errorCorrectionLevel","M")("colorDark","#9034db")("colorLight","#ffffff"))},dependencies:[ee,Hn],styles:["section[_ngcontent-%COMP%]{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--primary);padding:10px;border-radius:var(--light-radius);display:flex;align-items:center;justify-content:space-between;flex-direction:column;max-width:700px;width:90%}section[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{font-size:20px;color:var(--accent);text-align:center}section[_ngcontent-%COMP%]   .content[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;flex-direction:column;gap:10px;margin-top:10px}section[_ngcontent-%COMP%]   .content[_ngcontent-%COMP%]   .element[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;gap:10px}section[_ngcontent-%COMP%]   .content[_ngcontent-%COMP%]   .element.qr-code[_ngcontent-%COMP%]{flex-direction:column;margin-top:10px;gap:0}section[_ngcontent-%COMP%]   .content[_ngcontent-%COMP%]   .element[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{font-size:20px;font-weight:700;color:var(--secondary);text-align:left;width:180px}section[_ngcontent-%COMP%]   .content[_ngcontent-%COMP%]   .element.qr-code[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{text-align:center}section[_ngcontent-%COMP%]   .content[_ngcontent-%COMP%]   .element[_ngcontent-%COMP%]   .code[_ngcontent-%COMP%]{color:var(--accent);margin-left:10px;font-size:22px;letter-spacing:1px}.button-container[_ngcontent-%COMP%]{display:flex;justify-content:space-evenly;align-items:center;width:100%;gap:10px;flex-wrap:wrap}button[_ngcontent-%COMP%]{cursor:pointer;color:var(--accent);padding:5px;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:var(--light-radius);transition:.5s ease;width:160px;border:none;background-color:var(--primary)}button.share[_ngcontent-%COMP%]{width:50px}section[_ngcontent-%COMP%]   .button-container[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]{color:red;transition:.5s ease}section[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover{background-color:var(--accent);color:var(--primary)}section[_ngcontent-%COMP%]   .button-container[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]:hover{background-color:red;color:var(--primary)}section[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:40px}section[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]   .text[_ngcontent-%COMP%]{font-size:20px;font-weight:500;font-family:Roboto,Helvetica Neue,sans-serif}"]})};var ut=class n{transform(i,e){if(!i||!e)return"";let t=this.toJsDate(i),a=this.toJsDate(e).getTime()-t.getTime();if(a<0)return"";let o=Math.floor(a/1e3),s=Math.floor(o/86400),l=Math.floor(o%86400/3600),u=Math.floor(o%3600/60),p=o%60,x=Math.floor(a%1e3/100);return s>0?`${s}j ${l}h`:l>0?`${l}h ${u}m`:u>0?`${u}m ${p}s`:`${p}.${x}s`}toJsDate(i){return typeof i=="object"&&i!==null&&"toDate"in i&&typeof i.toDate=="function"?i.toDate():new Date(i)}static \u0275fac=function(e){return new(e||n)};static \u0275pipe=ti({name:"durationBetweenDates",type:n,pure:!0})};var ba=n=>({"alt-color":n});function va(n,i){n&1&&b(0,"i",12)}function ya(n,i){n&1&&b(0,"i",13)}function wa(n,i){n&1&&b(0,"i",14)}function Ca(n,i){if(n&1&&(d(0,"span",15),g(1),c()),n&2){let e=_(2).$index;m(),N(e+1)}}function xa(n,i){if(n&1&&(d(0,"div",5),M(1,va,1,0,"i",12)(2,ya,1,0,"i",13)(3,wa,1,0,"i",14)(4,Ca,2,1,"span",15),c()),n&2){let e=_().$index;m(),k(e+1===1?1:e+1===2?2:e+1===3?3:4)}}function Ma(n,i){if(n&1&&(d(0,"span",9),g(1),je(2,"durationBetweenDates"),c()),n&2){let e=_().$implicit,t=_();m(),N(li(2,1,t.room().startDate,e.finishDate))}}function ka(n,i){n&1&&b(0,"i",10)}function Ta(n,i){if(n&1){let e=A();d(0,"div",11)(1,"button",16),P("click",function(){E(e);let r=_().$implicit,a=_();return R(a.delete(r))}),b(2,"i",17),c()()}}function Ia(n,i){if(n&1&&(d(0,"div",2)(1,"div",3)(2,"div",4),M(3,xa,5,1,"div",5),d(4,"span",6),g(5),c(),d(6,"div",7)(7,"span",8),g(8),c(),M(9,Ma,3,4,"span",9)(10,ka,1,0,"i",10),c()()(),M(11,Ta,3,0,"div",11),c()),n&2){let e=i.$implicit,t=_();m(),T("ngClass",He(8,ba,e.userId!==t.player().userId)),m(2),k(t.players().length>1?3:-1),m(2),Ie("",e.username," ",e.animal),m(3),Ie("",t.getWinsCount(e)," / ",t.room().responses.length),m(),k(e.finishDate?9:10),m(2),k(e.userId!==t.player().userId&&t.room().userId===t.player().userId?11:-1)}}var Xn=class n{room=Z.required();player=Z.required();players=Z.required();deleteEvent=new O;delete(i){this.deleteEvent.emit(i)}getWinsCount(i){return i.currentRoomWins.filter(e=>!!e).length}static \u0275fac=function(e){return new(e||n)};static \u0275cmp=S({type:n,selectors:[["app-results-podium"]],inputs:{room:[1,"room"],player:[1,"player"],players:[1,"players"]},outputs:{deleteEvent:"deleteEvent"},decls:5,vars:0,consts:[[1,"title"],[1,"players"],[1,"container"],[1,"player",3,"ngClass"],[1,"flex"],[1,"podium"],[1,"username"],[1,"medals"],[1,"victory-number"],[1,"victory-number","time"],[1,"bx","bx-loader-alt","bx-spin",2,"color","var(--primary)"],[1,"button-container-delete"],[1,"bx","bxs-trophy",2,"color","gold"],[1,"bx","bxs-trophy",2,"color","silver"],[1,"bx","bxs-trophy",2,"color","#cd7f32"],[1,"order"],["type","button","title","Supprimer",1,"delete","share",3,"click"],[1,"bx","bxs-trash"]],template:function(e,t){e&1&&(d(0,"span",0),g(1,"Scores"),c(),d(2,"div",1),J(3,Ia,12,10,"div",2,$),c()),e&2&&(m(3),Y(t.players()))},dependencies:[ee,fe,ut],styles:["[_nghost-%COMP%]{width:100%;display:flex;justify-content:center;align-items:center;flex-direction:column}.title[_ngcontent-%COMP%]{font-size:20px;font-weight:800;color:var(--title-accent);margin-bottom:10px}.players[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;flex-direction:column;gap:10px}.players[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;flex-direction:column}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]{border-radius:var(--light-radius);background-color:var(--primary);color:var(--accent);padding:10px;width:340px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:28px}.players[_ngcontent-%COMP%]   .player.alt-color[_ngcontent-%COMP%]{color:var(--secondary)}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .flex[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;height:30px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .username[_ngcontent-%COMP%]{font-size:18px;font-weight:600;width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .podium[_ngcontent-%COMP%]{font-size:28px;display:flex;justify-content:center;align-items:center}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .podium[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%]{font-size:22px;padding:0 10px;border-radius:var(--light-radius);color:var(--primary);background-color:var(--accent)}.players[_ngcontent-%COMP%]   .player.alt-color[_ngcontent-%COMP%]   .podium[_ngcontent-%COMP%]   .order[_ngcontent-%COMP%]{background-color:var(--secondary)}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .medals[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;gap:5px;background-color:var(--accent);color:var(--primary);border-radius:var(--light-radius);padding:3px 5px 3px 10px;width:120px;height:28px}.players[_ngcontent-%COMP%]   .player.alt-color[_ngcontent-%COMP%]   .medals[_ngcontent-%COMP%]{background-color:var(--secondary)}.victory-number[_ngcontent-%COMP%]{font-size:18px;font-weight:600}.medals[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:28px}.score[_ngcontent-%COMP%]{margin-top:10px;display:flex;justify-content:center;align-items:center;gap:20px}.score[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{font-weight:700}.score[_ngcontent-%COMP%]   .bx-loader-alt[_ngcontent-%COMP%]{font-size:28px}.button-container-delete[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;margin-top:5px}.button-container-delete[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]{cursor:pointer;padding:10px;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:var(--light-radius);color:red;transition:.5s ease;border:none;background-color:var(--primary)}.button-container-delete[_ngcontent-%COMP%]   .delete.share[_ngcontent-%COMP%]{width:50px}.button-container-delete[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]:hover{background-color:red;color:var(--primary)}.button-container-delete[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:30px}@media screen and (max-width:370px){.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]{width:270px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .flex[_ngcontent-%COMP%]{height:unset;flex-direction:column;justify-content:center;gap:10px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .username[_ngcontent-%COMP%]{text-align:center}}"]})};var Ea=n=>({"alt-color":n});function Ra(n,i){n&1&&b(0,"i",8)}function Pa(n,i){n&1&&b(0,"i",9)}function Sa(n,i){if(n&1){let e=A();d(0,"div",13)(1,"button",14),P("click",function(){E(e);let r=_().$implicit,a=_();return R(a.delete(r))}),b(2,"i",15),c()()}}function Aa(n,i){if(n&1&&(d(0,"div",1)(1,"div",4)(2,"div",5)(3,"span",6),g(4),c(),d(5,"div",7),M(6,Ra,1,0,"i",8)(7,Pa,1,0,"i",9),d(8,"div",10)(9,"span",11),g(10),je(11,"totalMedalsNumber"),c(),b(12,"i",12),c()()()(),M(13,Sa,3,0,"div",13),c()),n&2){let e=i.$implicit,t=_();m(),T("ngClass",He(8,Ea,e.userId!==t.player().userId)),m(3),Ie("",e.username," ",e.animal),m(2),k(e.isReady&&t.room().userId!==e.userId?6:t.room().userId!==e.userId?7:-1),m(4),N(si(11,6,e)),m(3),k(e.userId!==t.player().userId&&t.room().userId===t.player().userId?13:-1)}}var Qn=class n{room=Z.required();player=Z.required();players=Z.required();deleteEvent=new O;delete(i){this.deleteEvent.emit(i)}static \u0275fac=function(e){return new(e||n)};static \u0275cmp=S({type:n,selectors:[["app-waiting-room"]],inputs:{room:[1,"room"],player:[1,"player"],players:[1,"players"]},outputs:{deleteEvent:"deleteEvent"},decls:5,vars:0,consts:[[1,"players"],[1,"container"],[1,"player","spinner"],["diameter","34"],[1,"player",3,"ngClass"],[1,"flex"],[1,"username"],[1,"end"],["title","Pr\xEAt",1,"bx","bxs-check-circle"],["title","Pas pr\xEAt",1,"bx","bxs-x-circle",2,"color","red"],[1,"medals"],[1,"victory-number"],[1,"bx","bxs-medal"],[1,"button-container-delete"],["type","button","title","Supprimer",1,"delete","share",3,"click"],[1,"bx","bxs-trash"]],template:function(e,t){e&1&&(d(0,"div",0),J(1,Aa,14,10,"div",1,$),d(3,"div",2),b(4,"mat-spinner",3),c()()),e&2&&(m(),Y(t.players()))},dependencies:[ee,fe,Ci,wi,Mi],styles:["[_nghost-%COMP%]{width:100%;display:flex;justify-content:center;align-items:center;flex-direction:column}.players[_ngcontent-%COMP%]{margin-top:20px;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:10px}.players[_ngcontent-%COMP%]   .container[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;flex-direction:column}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]{border-radius:var(--light-radius);background-color:var(--primary);color:var(--accent);padding:10px;width:340px}.players[_ngcontent-%COMP%]   .player.spinner[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:28px}.players[_ngcontent-%COMP%]   .player.alt-color[_ngcontent-%COMP%]{color:var(--secondary)}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .flex[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;height:30px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .username[_ngcontent-%COMP%]{font-size:18px;font-weight:600;width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .end[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;gap:10px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .medals[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;gap:5px;background-color:var(--accent);color:var(--primary);border-radius:var(--light-radius);padding:3px 5px 3px 10px;width:70px;height:28px}.players[_ngcontent-%COMP%]   .player.alt-color[_ngcontent-%COMP%]   .medals[_ngcontent-%COMP%]{background-color:var(--secondary)}.victory-number[_ngcontent-%COMP%]{font-size:18px;font-weight:600}.medals[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:28px}.button-container-delete[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;margin-top:5px}.button-container-delete[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]{cursor:pointer;padding:10px;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:var(--light-radius);color:red;transition:.5s ease;border:none;background-color:var(--primary)}.button-container-delete[_ngcontent-%COMP%]   .delete.share[_ngcontent-%COMP%]{width:50px}.button-container-delete[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]:hover{background-color:red;color:var(--primary)}.button-container-delete[_ngcontent-%COMP%]   .delete[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:30px}@media screen and (max-width:370px){.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]{width:270px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .flex[_ngcontent-%COMP%]{height:unset;flex-direction:column;justify-content:center;gap:10px}.players[_ngcontent-%COMP%]   .player[_ngcontent-%COMP%]   .username[_ngcontent-%COMP%]{text-align:center}}"]})};export{Ct as a,Li as b,Fi as c,jn as d,Xn as e,Qn as f};
