// pages/webview/webview.js
import { getOpenIdWithoutLoginCheck } from '../../data.js';

Page({
  data: {

  },

  onLoad: function (options) {
    const src = decodeURIComponent(options.src);
    getOpenIdWithoutLoginCheck().then(openId => {
      const srcWithOpenId = this.addOpenIdToUrl(src, openId);
      this.setData({ src: srcWithOpenId });
    })
  },

  /*
  给h5传入小程序的openId。
  考虑几种case:
  1. http://a.b.c/d        =>  http://a.b.c/d?openId=123       (末尾添加 ?openId=123)
  2. http://a.b.c/d?x=1    =>  http://a.b.c/d?x=1&openId=123   (末尾添加 &openId=123)
  3. http://a.b.c/d#z      =>  http://a.b.c/d?openId=123#z     (#前添加 ?openId=123)
  4. http://a.b.c/d?x=1#z  =>  http://a.b.c/d?x=1&openId=123#z (#前添加 &openId=123)
  */
  addOpenIdToUrl: function(src, openId) {
    //如果原来没有?，就添加?openId=123; 否则添加&openId=123.
    const openIdParam = src.indexOf('?') >= 0 ? `&openId=${openId}` : `?openId=${openId}`;
    //在#前，或者末尾添加openId参数
    return src.replace(/([^#]+)(#.*)?/, `$1${openIdParam}$2`);
  }
})