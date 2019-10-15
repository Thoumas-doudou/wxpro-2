// pages/component/share-panel.js
Component({
  properties: {
    shareImageUrl: String,
    show: Boolean,
  },

  data: {

  },

  methods: {
    onShareMaskClick: function() {
      this.triggerEvent('hidesharepanel');
    },
    onShareImageClick: function(e) {
      console.log('shareImageUrl', this.properties.shareImageUrl);
      wx.saveImageToPhotosAlbum({
        filePath: this.properties.shareImageUrl,
        success: e => {
          wx.showToast({ title: '图片已保存至相册', })
        },
        fail: e => {
          wx.previewImage({ urls: [this.properties.shareImageUrl], })
        }
      })
    }
  }
})
