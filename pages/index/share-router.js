// pages/index/share-router.js
Page({

  data: {

  },

  onLoad: function (options) {
    console.log('=========== share-router options', options);
    const url = decodeURIComponent((options.url || '').replace(';', '?') || options.scene);
    if (url) {
      // getApp().globalData.sharedUrl = url;
      global.sharedUrl = url;
      global.originSharedUrl = url;
    }
    console.log('=========== share-router url', url, global.sharedUrl);
    wx.showLoading({});
    wx.switchTab({
      url: '/pages/index/index',
      success: wx.hideLoading,
    })
  },
})