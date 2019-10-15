// pages/login/login.js
import { updateUserInfoWithWxData } from '../../data.js';

Page({

  data: {
  },

  onLoad: function (options) {
  },

  onGetUserInfo: function(e) {
    const userInfo = e.detail.userInfo;
    console.log('userInfo', userInfo);
    userInfo && updateUserInfoWithWxData(userInfo).then(res => {
      wx.switchTab({ url: '/pages/index/index' })
    }).catch(e => {
      console.error(e);
    });
  }
})