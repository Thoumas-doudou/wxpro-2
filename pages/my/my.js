// pages/my/my.js
import { getUserInfo } from '../../data.js';

//import '../../mock/data/getUserInfo.js';

Page({
  data: {
    nickName: '',
    sign: '',
    loading: true,
  },

  onShow: function (options) {
    this.data.nickname && wx.setNavigationBarTitle({
      title: `${this.data.nickname}的主页`,
    })

    getUserInfo().then(userInfoRes => {
      console.log('userInfoRes', userInfoRes);
      this.setData({
        ...userInfoRes.data,
        loading: false,
      });
    });
  },
})