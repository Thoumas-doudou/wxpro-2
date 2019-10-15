// pages/post/add.js
import { addPost } from '../../data.js';
import { countLetter } from '../../utils/util.js';

Page({
  data: {
    content: '',
    topic: {},
    images: [],
    sendEnabled: true,
    maxInputLength: 1024,
    wxId: '',
    anonymous: false,
  },

  onLoad: function(options) {
    const topic = {
      id: options.topicId,
      name: decodeURIComponent(options.topicName),
    }
    getApp().globalData.selectedTopic = topic;
    this.setData({ topic });
  },

  onShow: function (options) {
    const { selectedTopic = {} } = getApp().globalData;
    this.setData({ topic: selectedTopic });
  },

  onContentChange: function(e) {
    const content = e.detail.value;
    this.setData({content});
  },

  onWxIdChange: function (e) {
    const wxId = e.detail.value;
    this.setData({ wxId: wxId });
  },

  onImagesChange: function(e) {
    const images = e.detail.images;
    console.log('onImagesChange', e, e.detail);
    this.setData({images});
  },

  onAddPost: function() {
    if (!this.data.content && this.data.images.length === 0) {
      wx.showToast({ icon: 'none', title: '还未填写任何内容哦', });
      return;
    }
    
    const length = countLetter(this.data.content);
    if (length > this.data.maxInputLength) {
      wx.showToast({ icon: 'none', title: `超过最长字符限制`, });
      return;
    }

    if (!this.data.topic.id) {
      wx.showToast({ icon: 'none', title: '请选择主题', });
      return;
    }

    if (this.addPostPromise) {
      return;
    }

    this.addPostPromise = addPost({
      ...this.data,
      topicId: this.data.topic.id,
      wxId: this.data.wxId,
      specifiedOpenId: this.data.anonymous ? 'bot20000013' : null,
    }).then(post => {
      delete this.addPostPromise;
      console.log('成功', post);
      const postId = post.data.id;
      wx.showToast({
        title: `成功`,
      })
      getApp().globalData.shouldLoadNewData = true;
      wx.navigateBack({});
    }).catch(() => {
      delete this.addPostPromise;
    });
  },
  onAnonymousClick(e) {
    const anonymous = !this.data.anonymous;
    this.setData({ anonymous });
  }
})