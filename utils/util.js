export const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

export const formatFriendlyTime = date => {
  if (typeof date !== "object") {
    date = new Date(date);
  }
  const theTime = date.getTime();
  const now = new Date();
  const nowTime = now.getTime();
  const diff = nowTime - theTime;

  const ONE_MINUTE = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MINUTE;
  const ONE_DAY = 24 * ONE_HOUR;
  const ONE_WEEK = 7 * ONE_DAY;
  if (diff < ONE_MINUTE) {
    return "1分钟前";
  } else if (diff < ONE_HOUR) {
    return Math.floor(diff / ONE_MINUTE) + "分钟前";
  } else if (diff < ONE_DAY) {
    return Math.floor(diff / ONE_HOUR) + "小时前";
  } else if (diff < ONE_WEEK) {
    return Math.floor(diff / ONE_DAY) + "天前";
  } else if (date.getFullYear() === now.getFullYear()) {
    return (date.getMonth() + 1) + "/" + date.getDate();
  } else {
    return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
  }
}

//下面这段逻辑，可以让用户在某个元素上右滑200像素之后复制元素上的debugData数据。
let touchStart = {};
export const rightSwipeDebuger = {
  onTouchStart: function(e) {
    // console.log('touch start', e);
    const { debugData } = e.currentTarget.dataset;
    if (e.touches.length === 1) {
      touchStart = e.touches[0];
    }
  },
  onTouchEnd: function(e) {
    // console.log('touch end', e);
    const { debugData } = e.currentTarget.dataset;
    if (e.changedTouches.length !== 1) {
      return;
    }
    const touchEnd = e.changedTouches[0];
    // console.log('touchEnd', touchEnd, touchEnd.clientX - touchStart.clientX);
    if (touchEnd.clientX - touchStart.clientX > 200 && debugData) {
      wx.setClipboardData({ data: debugData + "", success: () => {
        wx.showToast({ icon: 'none', title: debugData + "" });
      } });
    }
  }
}

export function onCopyContent(e) {
  this.isLongTap = true;
  const content = e.currentTarget.dataset.content;
  content && wx.setClipboardData({
    data: content,
    success: () => wx.showToast({ title: '复制成功', })
  })
}

export function attrs(obj, ...keys) {
  return keys.reduce((res, k) => res && res[k], obj);
}

// 数字数，英文字符(ASCII 0~255)算1个，中文字符算2个。
export function countLetter(w) {
  return (w||'').split('').reduce((r, c) => c.match(/[^\x00-\xff]/ig) ? r+2 : r+1, 0);
}

export function limitContent(content, maxLength) {
  let currentLength = countLetter(content);
  while (content && currentLength > maxLength) {
    content = content.substr(0, content.length - 1);
    currentLength = countLetter(content);
  }
  return content;
}

export function jumpToUrl(url) {
  //分好多种情况，首先是小程序url。约定：'/'开头的都是小程序内url
  if (url.indexOf('/') === 0) {
    //小程序url，如果是tab页则用switchTab，否则用navigateTo
    const tabPageUrls = ['/pages/index/index', '/pages/messages/messages', '/pages/my/my'];
    const isTabPage = tabPageUrls.indexOf(url) >= 0;
    if (isTabPage) {
      wx.switchTab({ url: url, });
    } else {
      wx.navigateTo({ url: url, });
    }
    return;
  }
  //约定：wx:开头的是跳转到其他小程序的url
  if (url.indexOf('wx:') === 0) {
    //其他小程序的url，格式是wx:release:APP_ID://pages/xxx/xxx
    const m = url.match(/^wx:([^:]+):([^:]+):\/(.+)/);
    if (m) {
      const [ matched, env, appId, path ] = m;
      console.log('navigating to app', m.group);
      wx.navigateToMiniProgram({
        appId: appId,
        envVersion: env,
        path: path,
      })
    }
    return;
  }
  //约定：如果不是小程序内url，就认为是h5的url。跳转到webview去显示。
  let fixedUrl = url;
  //如果不是http或https开头，则自动加上https://
  if (/http(s):\/\//.test(fixedUrl) === false) {
    fixedUrl = 'https://' + fixedUrl;
  } else if (fixedUrl.indexOf('http://') === 0) {
    //如果是http:开头，自动替换为https。因为小程序webview的业务域名只支持https
    fixedUrl = fixedUrl.replace('http://', 'https://');
  } 
  const webviewUrl = '/pages/webview/webview?src=' + encodeURIComponent(fixedUrl);
  wx.navigateTo({ url: webviewUrl, })
}