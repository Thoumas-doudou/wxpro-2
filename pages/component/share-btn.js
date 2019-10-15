// pages/component/share-btn.js
const gAnimateDurationMs = 300; //这个并不会控制动画的时长，这只是用来控制点击的！要调整动画时长，请移步share-btn.wxss

Component({
  properties: {
    generateImageUrl: String,
    /**
     * 这个字段非常的hack。
     * 父元素无法主动通知该组件隐藏panel。
     * 如果用一个Boolean的property，传两次true进来，component会认为property没有变化，不会触发observer。
     * 我们采用的方案是监听一个object的property来实现。每次传进来一个{}，这样component会认为property都是不同的对象，
     * 于是每次set这个property都会触发observer
     */
    hideSharePanel: {
      type: Object,
      observer: function(newVal, oldVal) {
        this.setData({ show: false });
        this.triggerEvent('hidesharepanel');
      }
    },
    center: Boolean,
    post: Object,
    needBottomPadding: Boolean,
  },

  data: {
    show: false,
  },

  methods: {
    onShowSharePanel: function() {
      this.setData({ show: true });
      this.triggerEvent('showsharepanel');
    },
    onShareMaskClick: function () {
      this.setData({ show: false });
      this.triggerEvent('hidesharepanel');
    },
    onShareImageClick: function (e) {
      console.log('generateImageUrl', this.properties.generateImageUrl);

      this.sharePromise = this.sharePromise || new Promise((resolve, reject) => {
        wx.showLoading({ title: '正在生成...', mask: true })
        wx.downloadFile({
          url: this.properties.generateImageUrl,
          success: resolve,
          fail: reject,
        })
      }).then(res => {
        return new Promise((resolve, reject) => {
          // wx.previewImage({
          //   urls: [res.tempFilePath],
          //   success: resolve,
          //   fail: reject,
          // })
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: resolve,
            fail: reject,
          });
        });
      }).then(e => {
        wx.hideLoading();
        // console.log('save image succes', e);
        wx.showToast({ icon: 'none', title: '图片已保存至相册', })
        this.triggerEvent('imagesaved');
        //这里的延时是为了防止在消失的动画过程中按钮被点击。
        setTimeout(() => {
          this.sharePromise = null;
        }, gAnimateDurationMs);
      }).catch(e => {
        wx.hideLoading();
        // console.log('error saving image', e);
        wx.previewImage({ urls: [this.properties.generateImageUrl], })
        this.triggerEvent('imagepreviewed');
        //这里的延时是为了防止在消失的动画过程中按钮被点击。
        setTimeout(() => {
          this.sharePromise = null;
        }, gAnimateDurationMs);
      })
    }
  }
})
