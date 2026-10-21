import{c as e}from"./scene-3d-BJojWeBc.js";var t=Uint8Array,n=Uint16Array,r=Int32Array,i=new t([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),a=new t([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),o=new t([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),s=function(e,t){for(var i=new n(31),a=0;a<31;++a)i[a]=t+=1<<e[a-1];for(var o=new r(i[30]),a=1;a<30;++a)for(var s=i[a];s<i[a+1];++s)o[s]=s-i[a]<<5|a;return{b:i,r:o}},c=s(i,2),l=c.b,u=c.r;l[28]=258,u[258]=28;var d=s(a,0);d.b;for(var f=d.r,p=new n(32768),m=0;m<32768;++m){var h=(m&43690)>>1|(m&21845)<<1;h=(h&52428)>>2|(h&13107)<<2,h=(h&61680)>>4|(h&3855)<<4,p[m]=((h&65280)>>8|(h&255)<<8)>>1}for(var g=(function(e,t,r){for(var i=e.length,a=0,o=new n(t);a<i;++a)e[a]&&++o[e[a]-1];var s=new n(t);for(a=1;a<t;++a)s[a]=s[a-1]+o[a-1]<<1;var c;if(r){c=new n(1<<t);var l=15-t;for(a=0;a<i;++a)if(e[a])for(var u=a<<4|e[a],d=t-e[a],f=s[e[a]-1]++<<d,m=f|(1<<d)-1;f<=m;++f)c[p[f]>>l]=u}else for(c=new n(i),a=0;a<i;++a)e[a]&&(c[a]=p[s[e[a]-1]++]>>15-e[a]);return c}),_=new t(288),m=0;m<144;++m)_[m]=8;for(var m=144;m<256;++m)_[m]=9;for(var m=256;m<280;++m)_[m]=7;for(var m=280;m<288;++m)_[m]=8;for(var v=new t(32),m=0;m<32;++m)v[m]=5;var y=g(_,9,0),b=g(v,5,0),x=function(e){return(e+7)/8|0},S=function(e,n,r){return(n==null||n<0)&&(n=0),(r==null||r>e.length)&&(r=e.length),new t(e.subarray(n,r))},C=[`unexpected EOF`,`invalid block type`,`invalid length/literal`,`invalid distance`,`stream finished`,`no stream handler`,,`no callback`,`invalid UTF-8 data`,`extra field too long`,`date not in range 1980-2099`,`filename too long`,`stream finishing`,`invalid zip data`],w=function(e,t,n){var r=Error(t||C[e]);if(r.code=e,Error.captureStackTrace&&Error.captureStackTrace(r,w),!n)throw r;return r},T=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8},E=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8,e[r+2]|=n>>16},ee=function(e,r){for(var i=[],a=0;a<e.length;++a)e[a]&&i.push({s:a,f:e[a]});var o=i.length,s=i.slice();if(!o)return{t:A,l:0};if(o==1){var c=new t(i[0].s+1);return c[i[0].s]=1,{t:c,l:1}}i.sort(function(e,t){return e.f-t.f}),i.push({s:-1,f:25001});var l=i[0],u=i[1],d=0,f=1,p=2;for(i[0]={s:-1,f:l.f+u.f,l,r:u};f!=o-1;)l=i[i[d].f<i[p].f?d++:p++],u=i[d!=f&&i[d].f<i[p].f?d++:p++],i[f++]={s:-1,f:l.f+u.f,l,r:u};for(var m=s[0].s,a=1;a<o;++a)s[a].s>m&&(m=s[a].s);var h=new n(m+1),g=D(i[f-1],h,0);if(g>r){var a=0,_=0,v=g-r,y=1<<v;for(s.sort(function(e,t){return h[t.s]-h[e.s]||e.f-t.f});a<o;++a){var b=s[a].s;if(h[b]>r)_+=y-(1<<g-h[b]),h[b]=r;else break}for(_>>=v;_>0;){var x=s[a].s;h[x]<r?_-=1<<r-h[x]++-1:++a}for(;a>=0&&_;--a){var S=s[a].s;h[S]==r&&(--h[S],++_)}g=r}return{t:new t(h),l:g}},D=function(e,t,n){return e.s==-1?Math.max(D(e.l,t,n+1),D(e.r,t,n+1)):t[e.s]=n},O=function(e){for(var t=e.length;t&&!e[--t];);for(var r=new n(++t),i=0,a=e[0],o=1,s=function(e){r[i++]=e},c=1;c<=t;++c)if(e[c]==a&&c!=t)++o;else{if(!a&&o>2){for(;o>138;o-=138)s(32754);o>2&&(s(o>10?o-11<<5|28690:o-3<<5|12305),o=0)}else if(o>3){for(s(a),--o;o>6;o-=6)s(8304);o>2&&(s(o-3<<5|8208),o=0)}for(;o--;)s(a);o=1,a=e[c]}return{c:r.subarray(0,i),n:t}},k=function(e,t){for(var n=0,r=0;r<t.length;++r)n+=e[r]*t[r];return n},te=function(e,t,n){var r=n.length,i=x(t+2);e[i]=r&255,e[i+1]=r>>8,e[i+2]=e[i]^255,e[i+3]=e[i+1]^255;for(var a=0;a<r;++a)e[i+a+4]=n[a];return(i+4+r)*8},ne=function(e,t,r,s,c,l,u,d,f,p,m){T(t,m++,r),++c[256];for(var h=ee(c,15),x=h.t,S=h.l,C=ee(l,15),w=C.t,D=C.l,ne=O(x),re=ne.c,A=ne.n,j=O(w),M=j.c,N=j.n,P=new n(19),F=0;F<re.length;++F)++P[re[F]&31];for(var F=0;F<M.length;++F)++P[M[F]&31];for(var I=ee(P,7),L=I.t,R=I.l,z=19;z>4&&!L[o[z-1]];--z);var B=p+5<<3,V=k(c,_)+k(l,v)+u,H=k(c,x)+k(l,w)+u+14+3*z+k(P,L)+2*P[16]+3*P[17]+7*P[18];if(f>=0&&B<=V&&B<=H)return te(t,m,e.subarray(f,f+p));var U,W,G,K;if(T(t,m,1+(H<V)),m+=2,H<V){U=g(x,S,0),W=x,G=g(w,D,0),K=w;var ie=g(L,R,0);T(t,m,A-257),T(t,m+5,N-1),T(t,m+10,z-4),m+=14;for(var F=0;F<z;++F)T(t,m+3*F,L[o[F]]);m+=3*z;for(var q=[re,M],J=0;J<2;++J)for(var Y=q[J],F=0;F<Y.length;++F){var X=Y[F]&31;T(t,m,ie[X]),m+=L[X],X>15&&(T(t,m,Y[F]>>5&127),m+=Y[F]>>12)}}else U=y,W=_,G=b,K=v;for(var F=0;F<d;++F){var Z=s[F];if(Z>255){var X=Z>>18&31;E(t,m,U[X+257]),m+=W[X+257],X>7&&(T(t,m,Z>>23&31),m+=i[X]);var Q=Z&31;E(t,m,G[Q]),m+=K[Q],Q>3&&(E(t,m,Z>>5&8191),m+=a[Q])}else E(t,m,U[Z]),m+=W[Z]}return E(t,m,U[256]),m+W[256]},re=new r([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),A=new t(0),j=function(e,o,s,c,l,d){var p=d.z||e.length,m=new t(c+p+5*(1+Math.ceil(p/7e3))+l),h=m.subarray(c,m.length-l),g=d.l,_=(d.r||0)&7;if(o){_&&(h[0]=d.r>>3);for(var v=re[o-1],y=v>>13,b=v&8191,C=(1<<s)-1,w=d.p||new n(32768),T=d.h||new n(C+1),E=Math.ceil(s/3),ee=2*E,D=function(t){return(e[t]^e[t+1]<<E^e[t+2]<<ee)&C},O=new r(25e3),k=new n(288),A=new n(32),j=0,M=0,N=d.i||0,P=0,F=d.w||0,I=0;N+2<p;++N){var L=D(N),R=N&32767,z=T[L];if(w[R]=z,T[L]=R,F<=N){var B=p-N;if((j>7e3||P>24576)&&(B>423||!g)){_=ne(e,h,0,O,k,A,M,P,I,N-I,_),P=j=M=0,I=N;for(var V=0;V<286;++V)k[V]=0;for(var V=0;V<30;++V)A[V]=0}var H=2,U=0,W=b,G=R-z&32767;if(B>2&&L==D(N-G))for(var K=Math.min(y,B)-1,ie=Math.min(32767,N),q=Math.min(258,B);G<=ie&&--W&&R!=z;){if(e[N+H]==e[N+H-G]){for(var J=0;J<q&&e[N+J]==e[N+J-G];++J);if(J>H){if(H=J,U=G,J>K)break;for(var Y=Math.min(G,J-2),X=0,V=0;V<Y;++V){var Z=N-G+V&32767,Q=Z-w[Z]&32767;Q>X&&(X=Q,z=Z)}}}R=z,z=w[R],G+=R-z&32767}if(U){O[P++]=268435456|u[H]<<18|f[U];var ae=u[H]&31,$=f[U]&31;M+=i[ae]+a[$],++k[257+ae],++A[$],F=N+H,++j}else O[P++]=e[N],++k[e[N]]}}for(N=Math.max(N,F);N<p;++N)O[P++]=e[N],++k[e[N]];_=ne(e,h,g,O,k,A,M,P,I,N-I,_),g||(d.r=_&7|h[_/8|0]<<3,_-=7,d.h=T,d.p=w,d.i=N,d.w=F)}else{for(var N=d.w||0;N<p+g;N+=65535){var oe=N+65535;oe>=p&&(h[_/8|0]=g,oe=p),_=te(h,_+1,e.subarray(N,oe))}d.i=p}return S(m,0,c+x(_)+l)},M=(function(){for(var e=new Int32Array(256),t=0;t<256;++t){for(var n=t,r=9;--r;)n=(n&1&&-306674912)^n>>>1;e[t]=n}return e})(),N=function(){var e=-1;return{p:function(t){for(var n=e,r=0;r<t.length;++r)n=M[n&255^t[r]]^n>>>8;e=n},d:function(){return~e}}},P=function(e,n,r,i,a){if(!a&&(a={l:1},n.dictionary)){var o=n.dictionary.subarray(-32768),s=new t(o.length+e.length);s.set(o),s.set(e,o.length),e=s,a.w=o.length}return j(e,n.level==null?6:n.level,n.mem==null?a.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+n.mem,r,i,a)},F=function(e,t){var n={};for(var r in e)n[r]=e[r];for(var r in t)n[r]=t[r];return n},I=function(e,t,n){for(;n;++t)e[t]=n,n>>>=8};function L(e,t){return P(e,t||{},0,0)}var R=function(e,n,r,i){for(var a in e){var o=e[a],s=n+a,c=i;Array.isArray(o)&&(c=F(i,o[1]),o=o[0]),o instanceof t?r[s]=[o,c]:(r[s+=`/`]=[new t(0),c],R(o,s,r,i))}},z=typeof TextEncoder<`u`&&new TextEncoder,B=typeof TextDecoder<`u`&&new TextDecoder;try{B.decode(A,{stream:!0})}catch{}function V(e,n){if(n){for(var r=new t(e.length),i=0;i<e.length;++i)r[i]=e.charCodeAt(i);return r}if(z)return z.encode(e);for(var a=e.length,o=new t(e.length+(e.length>>1)),s=0,c=function(e){o[s++]=e},i=0;i<a;++i){if(s+5>o.length){var l=new t(s+8+(a-i<<1));l.set(o),o=l}var u=e.charCodeAt(i);u<128||n?c(u):u<2048?(c(192|u>>6),c(128|u&63)):u>55295&&u<57344?(u=65536+(u&1047552)|e.charCodeAt(++i)&1023,c(240|u>>18),c(128|u>>12&63),c(128|u>>6&63),c(128|u&63)):(c(224|u>>12),c(128|u>>6&63),c(128|u&63))}return S(o,0,s)}var H=function(e){var t=0;if(e)for(var n in e){var r=e[n].length;r>65535&&w(9),t+=r+4}return t},U=function(e,t,n,r,i,a,o,s){var c=r.length,l=n.extra,u=s&&s.length,d=H(l);I(e,t,o==null?67324752:33639248),t+=4,o!=null&&(e[t++]=20,e[t++]=n.os),e[t]=20,t+=2,e[t++]=n.flag<<1|(a<0&&8),e[t++]=i&&8,e[t++]=n.compression&255,e[t++]=n.compression>>8;var f=new Date(n.mtime==null?Date.now():n.mtime),p=f.getFullYear()-1980;if((p<0||p>119)&&w(10),I(e,t,p<<25|f.getMonth()+1<<21|f.getDate()<<16|f.getHours()<<11|f.getMinutes()<<5|f.getSeconds()>>1),t+=4,a!=-1&&(I(e,t,n.crc),I(e,t+4,a<0?-a-2:a),I(e,t+8,n.size)),I(e,t+12,c),I(e,t+14,d),t+=16,o!=null&&(I(e,t,u),I(e,t+6,n.attrs),I(e,t+10,o),t+=14),e.set(r,t),t+=c,d)for(var m in l){var h=l[m],g=h.length;I(e,t,+m),I(e,t+2,g),e.set(h,t+4),t+=4+g}return u&&(e.set(s,t),t+=u),t},W=function(e,t,n,r,i){I(e,t,101010256),I(e,t+8,n),I(e,t+10,n),I(e,t+12,r),I(e,t+16,i)};function G(e,n){n||={};var r={},i=[];R(e,``,r,n);var a=0,o=0;for(var s in r){var c=r[s],l=c[0],u=c[1],d=u.level==0?0:8,f=V(s),p=f.length,m=u.comment,h=m&&V(m),g=h&&h.length,_=H(u.extra);p>65535&&w(11);var v=d?L(l,u):l,y=v.length,b=N();b.p(l),i.push(F(u,{size:l.length,crc:b.d(),c:v,f,m:h,u:p!=s.length||h&&m.length!=g,o:a,compression:d})),a+=30+p+_+y,o+=76+2*(p+_)+(g||0)+y}for(var x=new t(o+22),S=a,C=o-a,T=0;T<i.length;++T){var f=i[T];U(x,f.o,f,f.f,f.u,f.c.length);var E=30+f.f.length+H(f.extra);x.set(f.c,f.o+E),U(x,a,f,f.f,f.u,f.c.length,f.o,f.m),a+=16+E+(f.m?f.m.length:0)}return W(x,a,i.length,C,S),x}var K=class{constructor(){this.textureUtils=null}setTextureUtils(e){this.textureUtils=e}parse(e,t,n,r){this.parseAsync(e,r).then(t).catch(n)}async parseAsync(e,t={}){t=Object.assign({ar:{anchoring:{type:`plane`},planeAnchoring:{alignment:`horizontal`}},includeAnchoringProperties:!0,quickLookCompatible:!1,maxTextureSize:1024},t);let n={},r=`model.usda`;n[r]=null;let i=J();i+=Y(t);let a={},o={};e.traverseVisible(e=>{if(e.isMesh){let t=e.geometry,r=e.material;if(r.isMeshStandardMaterial){let o=`geometries/Geometry_`+t.id+`.usda`;if(!(o in n)){let e=oe(t);n[o]=Z(e)}r.uuid in a||(a[r.uuid]=r),i+=Q(e,t,r)}else console.warn(`THREE.USDZExporter: Unsupported material type (USDZ only supports MeshStandardMaterial)`,e)}else e.isCamera&&(i+=ve(e))}),i+=X(),i+=pe(a,o,t.quickLookCompatible),n[r]=V(i),i=null;for(let e in o){let r=o[e];if(r.isCompressedTexture===!0){if(this.textureUtils===null)throw Error(`THREE.USDZExporter: setTextureUtils() must be called to process compressed textures.`);r=await this.textureUtils.decompress(r)}let i=ie(r.image,r.flipY,t.maxTextureSize),a=await new Promise(e=>i.toBlob(e,`image/png`,1));n[`textures/Texture_${e}.png`]=new Uint8Array(await a.arrayBuffer())}let s=0;for(let e in n){let t=n[e],r=34+e.length;s+=r;let i=s&63;if(i!==4){let r=64-i;n[e]=[t,{extra:{12345:new Uint8Array(r)}}]}s=t.length}return G(n,{level:0})}};function ie(e,t,n){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let r=n/Math.max(e.width,e.height),i=document.createElement(`canvas`);i.width=e.width*Math.min(1,r),i.height=e.height*Math.min(1,r);let a=i.getContext(`2d`);return t===!0&&(a.translate(0,i.height),a.scale(1,-1)),a.drawImage(e,0,0,i.width,i.height),i}throw Error(`THREE.USDZExporter: No valid image data found. Unable to process texture.`)}var q=7;function J(){return`#usda 1.0
(
	customLayerData = {
		string creator = "Three.js USDZExporter"
	}
	defaultPrim = "Root"
	metersPerUnit = 1
	upAxis = "Y"
)

`}function Y(e){return`def Xform "Root"
{
	def Scope "Scenes" (
		kind = "sceneLibrary"
	)
	{
		def Xform "Scene" (
			customData = {
				bool preliminary_collidesWithEnvironment = 0
				string sceneName = "Scene"
			}
			sceneName = "Scene"
		)
		{${e.includeAnchoringProperties===!0?`
		token preliminary:anchoring:type = "${e.ar.anchoring.type}"
		token preliminary:planeAnchoring:alignment = "${e.ar.planeAnchoring.alignment}"
	`:``}
`}function X(){return`
		}
	}
}

`}function Z(e){let t=J();return t+=e,V(t)}function Q(e,t,n){let r=`Object_`+e.id,i=ae(e.matrixWorld);return e.matrixWorld.determinant()<0&&console.warn(`THREE.USDZExporter: USDZ does not support negative scales`,e),`def Xform "${r}" (
	prepend references = @./geometries/Geometry_${t.id}.usda@</Geometry>
	prepend apiSchemas = ["MaterialBindingAPI"]
)
{
	matrix4d xformOp:transform = ${i}
	uniform token[] xformOpOrder = ["xformOp:transform"]

	rel material:binding = </Materials/Material_${n.id}>
}

`}function ae(e){let t=e.elements;return`( ${$(t,0)}, ${$(t,4)}, ${$(t,8)}, ${$(t,12)} )`}function $(e,t){return`(${e[t+0]}, ${e[t+1]}, ${e[t+2]}, ${e[t+3]})`}function oe(e){return`
def "Geometry"
{
${se(e)}
}
`}function se(e){let t=e.attributes,n=t.position.count;return`
	def Mesh "Geometry"
	{
		int[] faceVertexCounts = [${ce(e)}]
		int[] faceVertexIndices = [${le(e)}]
		normal3f[] normals = [${ue(t.normal,n)}] (
			interpolation = "vertex"
		)
		point3f[] points = [${ue(t.position,n)}]
${fe(t)}
		uniform token subdivisionScheme = "none"
	}
`}function ce(e){let t=e.index===null?e.attributes.position.count:e.index.count;return Array(t/3).fill(3).join(`, `)}function le(e){let t=e.index,n=[];if(t!==null)for(let e=0;e<t.count;e++)n.push(t.getX(e));else{let t=e.attributes.position.count;for(let e=0;e<t;e++)n.push(e)}return n.join(`, `)}function ue(e,t){if(e===void 0)return console.warn(`USDZExporter: Normals missing.`),Array(t).fill(`(0, 0, 0)`).join(`, `);let n=[];for(let t=0;t<e.count;t++){let r=e.getX(t),i=e.getY(t),a=e.getZ(t);n.push(`(${r.toPrecision(q)}, ${i.toPrecision(q)}, ${a.toPrecision(q)})`)}return n.join(`, `)}function de(e){let t=[];for(let n=0;n<e.count;n++){let r=e.getX(n),i=e.getY(n);t.push(`(${r.toPrecision(q)}, ${1-i.toPrecision(q)})`)}return t.join(`, `)}function fe(e){let t=``;for(let n=0;n<4;n++){let r=n>0?n:``,i=e[`uv`+r];i!==void 0&&(t+=`
		texCoord2f[] primvars:st${r} = [${de(i)}] (
			interpolation = "vertex"
		)`)}let n=e.color;if(n!==void 0){let e=n.count;t+=`
	color3f[] primvars:displayColor = [${ue(n,e)}] (
		interpolation = "vertex"
		)`}return t}function pe(e,t,n=!1){let r=[];for(let i in e){let a=e[i];r.push(me(a,t,n))}return`def "Materials"
{
${r.join(``)}
}

`}function me(t,n,r=!1){let i=[],a=[];function o(e,i,a){let o=e.source.id+`_`+e.flipY;n[o]=e;let s=e.channel>0?`st`+e.channel:`st`,c={1e3:`repeat`,1001:`clamp`,1002:`mirror`},l=e.repeat.clone(),u=e.offset.clone(),d=e.rotation,f=Math.sin(d),p=Math.cos(d);return u.y=1-u.y-l.y,r?(u.x/=l.x,u.y/=l.y,u.x+=f/l.x,u.y+=p-1):(u.x+=f*l.x,u.y+=(1-p)*l.y),`
		def Shader "PrimvarReader_${i}"
		{
			uniform token info:id = "UsdPrimvarReader_float2"
			float2 inputs:fallback = (0.0, 0.0)
			token inputs:varname = "${s}"
			float2 outputs:result
		}

		def Shader "Transform2d_${i}"
		{
			uniform token info:id = "UsdTransform2d"
			token inputs:in.connect = </Materials/Material_${t.id}/PrimvarReader_${i}.outputs:result>
			float inputs:rotation = ${(180/Math.PI*d).toFixed(q)}
			float2 inputs:scale = ${_e(l)}
			float2 inputs:translation = ${_e(u)}
			float2 outputs:result
		}

		def Shader "Texture_${e.id}_${i}"
		{
			uniform token info:id = "UsdUVTexture"
			asset inputs:file = @textures/Texture_${o}.png@
			float2 inputs:st.connect = </Materials/Material_${t.id}/Transform2d_${i}.outputs:result>
			${a===void 0?``:`float4 inputs:scale = `+ge(a)}
			token inputs:sourceColorSpace = "${e.colorSpace===``?`raw`:`sRGB`}"
			token inputs:wrapS = "${c[e.wrapS]}"
			token inputs:wrapT = "${c[e.wrapT]}"
			float outputs:r
			float outputs:g
			float outputs:b
			float3 outputs:rgb
			${t.transparent||t.alphaTest>0?`float outputs:a`:``}
		}`}return t.side===2&&console.warn(`THREE.USDZExporter: USDZ does not support double sided materials`,t),t.map===null?i.push(`			color3f inputs:diffuseColor = ${he(t.color)}`):(i.push(`			color3f inputs:diffuseColor.connect = </Materials/Material_${t.id}/Texture_${t.map.id}_diffuse.outputs:rgb>`),t.transparent?i.push(`			float inputs:opacity.connect = </Materials/Material_${t.id}/Texture_${t.map.id}_diffuse.outputs:a>`):t.alphaTest>0&&(i.push(`			float inputs:opacity.connect = </Materials/Material_${t.id}/Texture_${t.map.id}_diffuse.outputs:a>`),i.push(`			float inputs:opacityThreshold = ${t.alphaTest}`)),a.push(o(t.map,`diffuse`,t.color))),t.emissiveMap===null?t.emissive.getHex()>0&&i.push(`			color3f inputs:emissiveColor = ${he(t.emissive)}`):(i.push(`			color3f inputs:emissiveColor.connect = </Materials/Material_${t.id}/Texture_${t.emissiveMap.id}_emissive.outputs:rgb>`),a.push(o(t.emissiveMap,`emissive`,new e(t.emissive.r*t.emissiveIntensity,t.emissive.g*t.emissiveIntensity,t.emissive.b*t.emissiveIntensity)))),t.normalMap!==null&&(i.push(`			normal3f inputs:normal.connect = </Materials/Material_${t.id}/Texture_${t.normalMap.id}_normal.outputs:rgb>`),a.push(o(t.normalMap,`normal`))),t.aoMap!==null&&(i.push(`			float inputs:occlusion.connect = </Materials/Material_${t.id}/Texture_${t.aoMap.id}_occlusion.outputs:r>`),a.push(o(t.aoMap,`occlusion`,new e(t.aoMapIntensity,t.aoMapIntensity,t.aoMapIntensity)))),t.roughnessMap===null?i.push(`			float inputs:roughness = ${t.roughness}`):(i.push(`			float inputs:roughness.connect = </Materials/Material_${t.id}/Texture_${t.roughnessMap.id}_roughness.outputs:g>`),a.push(o(t.roughnessMap,`roughness`,new e(t.roughness,t.roughness,t.roughness)))),t.metalnessMap===null?i.push(`			float inputs:metallic = ${t.metalness}`):(i.push(`			float inputs:metallic.connect = </Materials/Material_${t.id}/Texture_${t.metalnessMap.id}_metallic.outputs:b>`),a.push(o(t.metalnessMap,`metallic`,new e(t.metalness,t.metalness,t.metalness)))),t.alphaMap===null?i.push(`			float inputs:opacity = ${t.opacity}`):(i.push(`			float inputs:opacity.connect = </Materials/Material_${t.id}/Texture_${t.alphaMap.id}_opacity.outputs:r>`),i.push(`			float inputs:opacityThreshold = 0.0001`),a.push(o(t.alphaMap,`opacity`))),t.isMeshPhysicalMaterial&&(t.clearcoatMap===null?i.push(`			float inputs:clearcoat = ${t.clearcoat}`):(i.push(`			float inputs:clearcoat.connect = </Materials/Material_${t.id}/Texture_${t.clearcoatMap.id}_clearcoat.outputs:r>`),a.push(o(t.clearcoatMap,`clearcoat`,new e(t.clearcoat,t.clearcoat,t.clearcoat)))),t.clearcoatRoughnessMap===null?i.push(`			float inputs:clearcoatRoughness = ${t.clearcoatRoughness}`):(i.push(`			float inputs:clearcoatRoughness.connect = </Materials/Material_${t.id}/Texture_${t.clearcoatRoughnessMap.id}_clearcoatRoughness.outputs:g>`),a.push(o(t.clearcoatRoughnessMap,`clearcoatRoughness`,new e(t.clearcoatRoughness,t.clearcoatRoughness,t.clearcoatRoughness)))),i.push(`			float inputs:ior = ${t.ior}`)),`
	def Material "Material_${t.id}"
	{
		def Shader "PreviewSurface"
		{
			uniform token info:id = "UsdPreviewSurface"
${i.join(`
`)}
			int inputs:useSpecularWorkflow = 0
			token outputs:surface
		}

		token outputs:surface.connect = </Materials/Material_${t.id}/PreviewSurface.outputs:surface>

${a.join(`
`)}

	}
`}function he(e){return`(${e.r}, ${e.g}, ${e.b})`}function ge(e){return`(${e.r}, ${e.g}, ${e.b}, 1.0)`}function _e(e){return`(${e.x}, ${e.y})`}function ve(e){let t=e.name?e.name:`Camera_`+e.id,n=ae(e.matrixWorld);return e.matrixWorld.determinant()<0&&console.warn(`THREE.USDZExporter: USDZ does not support negative scales`,e),e.isOrthographicCamera?`def Camera "${t}"
		{
			matrix4d xformOp:transform = ${n}
			uniform token[] xformOpOrder = ["xformOp:transform"]

			float2 clippingRange = (${e.near.toPrecision(q)}, ${e.far.toPrecision(q)})
			float horizontalAperture = ${((Math.abs(e.left)+Math.abs(e.right))*10).toPrecision(q)}
			float verticalAperture = ${((Math.abs(e.top)+Math.abs(e.bottom))*10).toPrecision(q)}
			token projection = "orthographic"
		}
	
	`:`def Camera "${t}"
		{
			matrix4d xformOp:transform = ${n}
			uniform token[] xformOpOrder = ["xformOp:transform"]

			float2 clippingRange = (${e.near.toPrecision(q)}, ${e.far.toPrecision(q)})
			float focalLength = ${e.getFocalLength().toPrecision(q)}
			float focusDistance = ${e.focus.toPrecision(q)}
			float horizontalAperture = ${e.getFilmWidth().toPrecision(q)}
			token projection = "perspective"
			float verticalAperture = ${e.getFilmHeight().toPrecision(q)}
		}
	
	`}export{K as USDZExporter};