// pages/my/my-profile.js
import { getUserInfo, updateUserInfo, uploadAvatar } from '../../data.js';

Page({
  data: {

  },

  onLoad: function () {
    getUserInfo({ noCache: true }).then(userInfoRes => {
      console.log('userInfoRes', userInfoRes);
      this.setData(userInfoRes.data);
    })
  },

  onShow: function() {
    //这一段是从编辑页面返回时会进入的
    const {
      myProfileValue, myProfileField, isFromMyProfileEdit
    } = getApp().globalData;
    
    if (myProfileValue) {
      const data = this.data;
      data[myProfileField] = myProfileValue;
      this.setData(data);
    }
    if (isFromMyProfileEdit) {
      getApp().globalData.isFromMyProfileEdit = false;
      return;
    }

    //如果是直接进入这个面，则需要加载在线数据
    getUserInfo().then(userInfoRes => {
      console.log('userInfoRes', userInfoRes);
      this.setData(userInfoRes.data);
    })
  },

  onListItemClick: function(e) {
    const {url, field} = e.currentTarget.dataset;
    if (field === 'avatarUrl') {
      new Promise((resolve, reject) => {
        getApp().globalData.isFromMyProfileEdit = false;
        getApp().globalData.myProfileValue = null;
        wx.chooseImage({ count: 1, success: resolve })
      }).then(res => {
        const userInfo = this.data;
        const filePath = res.tempFilePaths[0];
        if (!filePath) { return; }
        userInfo.isUserSetAvatar = true;
        wx.showLoading({})
        uploadAvatar(filePath).then(avatarUrl => {
          console.log('avatarUrl after upload', avatarUrl);
          userInfo.avatarUrl = avatarUrl;
          this.setData({ avatarUrl: userInfo.avatarUrl });
          return updateUserInfo(userInfo);
        })
        .then(wx.hideLoading)
        .catch(wx.hideLoading)
      })
      return;
    }
    wx.navigateTo({ url, });
  }
})