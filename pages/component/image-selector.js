// pages/component/image-selector.js
Component({
  properties: {
    maximages: {
      type: Number,
      value: 9,
    },
    hidepadding: Boolean,
    displayImages: {
      type: Array,
      value: [],
      observer: function(newVal, oldVal) {
        console.log('images', newVal);
        this.setData({ images: [newVal] });
      }
    },
    // imageSize 图片选择器中选中图后的缩略图大小。可选取值为 small | large
    imageSize: {
      type: String,
      value: 'small',
    }
  },

  data: {
    maximages: 9,
    images: []
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChooseImage: function() {
      if (this.data.images.length > maximages) {
        return;
      }
      this.triggerEvent('selectstart');
      const maximages = this.properties.maximages;
      wx.chooseImage({
        count: maximages - this.data.images.length,
        success: (res) => {
          if (res.tempFilePaths.length > 0) {
            this.setData({
              images: [...this.data.images, ...res.tempFilePaths],
            })
            console.log('images', this.data.images);

            this.triggerEvent('imageschange', { images: this.data.images });
          }
          this.triggerEvent('selectend');          
        },
      })
    },

    onRemoveImage: function(e) {
      const index = e.currentTarget.dataset.index;
      this.data.images.splice(index, 1);
      this.setData({ images: this.data.images });
      this.triggerEvent('imageschange', { images: this.data.images });
    }
  }
})
