// pages/my/my-profile-edit.js
import { updateUserInfo, uploadAvatar } from '../../data.js';
import { countLetter, limitContent } from '../../utils/util.js';

Page({
  data: {
    field: '',
    value: '',
    currentLength: 0,
    maxInputLength: 20,
  },

  onLoad: function (options) {
    this.setData(options);
    getApp().globalData.myProfileValue = null;
    getApp().globalData.myProfileField = null;
    getApp().globalData.isFromMyProfileEdit = true;
  },

  onInput: function(e) {
    // let value = limitContent(e.detail.value, this.data.maxInputLength);
    let value = e.detail.value;
    this.setData({ value, });
  },

  onBlur: function (e) {
    let value = e.detail.value.trim();
    this.setData({ value, });
  },

  onConfirm: function() {
    console.log('confirm', this.data.value);
    getApp().globalData.myProfileValue = this.data.value;
    getApp().globalData.myProfileField = this.data.field;

    new Promise((resolve, reject) => {
      const userInfo = {}
      this.data.value = this.data.value.trim();
      userInfo[this.data.field] = this.data.value;
      const length = countLetter(this.data.value);
      if (this.data.field === 'nickName') {
        userInfo.isUserSetNickName = true;
        if (length < 4) {
          return reject("昵称长度不能小于4个字符");
        } else if (length > this.data.maxInputLength) {
          return reject(`昵称长度不能超过${this.data.maxInputLength}个字符`);
        }
      } else if (this.data.field === 'avatarUrl') {
        userInfo.isUserSetAvatar = true;
        uploadAvatar(this.data.value).then(avatarUrl => {
          userInfo.avatarUrl = avatarUrl;
          resolve(userInfo);
        });
        return;
      } else if (this.data.field === 'sign') {
        if (length > this.data.maxInputLength) {
          return reject(`签名长度不能超过${this.data.maxInputLength}个字`);
        }
      } else if (this.data.field === 'phone') {
        if (!/^1\d{10}$/.test(this.data.value)) {
          return reject(`请输入11位手机号`);
        }
      }
      resolve(userInfo);
    }).then(userInfo => {
      updateUserInfo(userInfo).then(() => {
        wx.navigateBack({});
      }).catch(message => {
        wx.showToast({ icon: 'none', title: message, });
      });
    }).catch(e => {
      if (typeof e === 'string') {        
        wx.showToast({ icon: 'none', title: e, })
        return;
      }
      console.warn(e);
      wx.showToast({ icon: 'none', title: '更新失败', })
    })
  },

  onEditAvatar: function() {
    new Promise((resolve, reject) => {
      wx.chooseImage({ success: resolve })
    }).then(res => {
      const filePath = res.tempFilePaths[0];
      this.setData({ value: filePath });
      // return Promise.all([Promise.resolve(filePath), uploadAvatar(filePath)]);
    })
    // .then(([filePath, avatarUrl]) => {
    //   this.setData({ value: avatarUrl });
    // })
  },

  onGetPhoneNumber: function(e) {
    console.log('phone number result:', e);
  }
})