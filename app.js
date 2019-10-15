//app.js
require('./es5-shim.min.js');
import { getUnreadMessageCount } from './data.js';
var fundebug = require('./utils/fundebug.0.9.0.min.js');
fundebug.init({
  apikey: 'ac2aa84f17fc33ea2cef3bb06881865f021a3b87d096e4766b19bb9cc9249b2e',
  monitorHttpData: true,
  setSystemInfo: true,
  monitorMethodCall: true,
})

App({
  onLaunch: function (options) {
    console.log('App.onLaunch options', options);
    //设置tab bar item里的的消息数量
    getUnreadMessageCount().then(count => {
      if (count > 0) {
        wx.setTabBarBadge({ index: 1, text: String(count), });
      }
    })

    //研究云函数用的，请不要删掉
    wx.cloud.init({
      env: 'prod-aaabb3',
      traceUser: true,
    });
    // wx.cloud.callFunction({
    //   name: 'testHello',
    //   data: {
    //     a: 1, b: 2,
    //   },
    // }).then(res => {
    //   console.log('testHelloWorld result:', res);
    // }).catch(e => {
    //   console.log('testHelloWorld error:', e);
    // })
  },
  globalData: {
    shouldLoadNewData: false,
    shouldLoadReplies: false,
  },
  onShow: function (options) {
    wx.getSystemInfo({
      success: (res) => {
        //给 iPhone X 的地步增加padding
        if (/iPhone X/i.test(res.model)) {
          global.isAddBottomPadding = true;
        }
      },
    })
  },
})

global = {
  ...global,
  events: {},
  on: function (eventName, callback, that) {
    if (!eventName || typeof callback !== 'function') {
      console.error('add event listener failed', eventName, callback);
      return;
    }
    global.events[eventName] = global.events[eventName] || [];
    const eventList = global.events[eventName];
    if (eventList.indexOf(callback) < 0) {
      eventList.push({ callback, that });
    };
  },
  off: function (eventName, callback, that) {
    if (!eventName) {
      return;
    }
    if (!callback) {
      global.events[eventName] = [];
      return;
    }
    const eventList = global.events[eventName];
    const index = eventList.findIndex(event => event.callback === callback && event.that === that);
    if (index >= 0) {
      eventList.splice(index, 1);
    }
    // console.log('[event] off', eventName, callback, that);
  },
  trigger: function (eventName, ...data) {
    if (!eventName) {
      return;
    }
    const eventList = global.events[eventName] || [];
    // console.log('[event] trigger', eventName, eventList);
    eventList.forEach(e => {
      e.callback.apply(e.that, data)
      // console.log('[event] [trigger]', e);
    });
  }
}