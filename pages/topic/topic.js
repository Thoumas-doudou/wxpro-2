// pages/topic/topic.js
// import '../../mock/data/topic.js';
import { getTopic, getMorePostsByStore, getSendContentEnabled, getQrcodeImageUrl, getMorePostsByTime } from '../../data.js';
import { handleSharePost, listenToPostChanges, unlistenToPostChanges } from '../../utils/helper.js';

Page({
  data: {
    posts: [],
    showHomeBtn: false,
    loading: true,
    sendContentEnabled: false,
    generateImageUrl: '',
    hideSharePanel: false,
    sortTypes: [
      { name: '按时间排序', type: 'TIME'},
      { name: '按热度排序', type: 'SCORE' },
    ],
    sortTypeIndex: 1,
  },

  onLoad: function (options) {
    const id = options.id || 1;
    const type = this.data.sortTypes[this.data.sortTypeIndex].type;
    getTopic(id, type).then(topicData => {
      this.setData(topicData);
      this.setData({ loading: false });
    });

    const showHomeBtn = getCurrentPages().length === 1;
    this.setData({ showHomeBtn });

    listenToPostChanges(this);
    getSendContentEnabled().then(sendContentEnabled => this.setData({ sendContentEnabled }));

    this.setData({
      generateImageUrl: getQrcodeImageUrl('/pages/topic/topic?id=' + id),
    });
  },

  onUnload: function() {
    unlistenToPostChanges(this);
  },

  onShow: function () {
    if (getApp().globalData.shouldLoadNewData) {
      this.onPullDownRefresh();
      // getApp().globalData.shouldLoadNewData = false;
    }
    this.setData({ sharePost: 0 });
  },

  onPullDownRefresh: function () {
    const id = this.data.id;
    const type = this.data.sortTypes[this.data.sortTypeIndex].type;
    getTopic(id, type).then(topicData => {
      wx.stopPullDownRefresh();
      this.setData(topicData);
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  onLikeChange: function (e) {
    console.log('like changed', e.detail);
    const { id, isLiked } = e.detail;
    const post = this.data.posts.find(p => p.id === id);
    post.isLiked = isLiked;
    post.likeCount += isLiked ? +1 : -1;
    this.setData({ posts: this.data.posts });
  },

  onShareAppMessage: function(e) {
    const { id, content, imageUrls, isShared, nickName } = (e.target || {}).dataset || {};

    if (e.from === 'button' && id) {
      const post = this.data.posts.find(p => p.id === id);
      this.setData({ sharePost: post });

      return handleSharePost({
        id, isShared, 
        title: nickName + ': ' + (content || '发表帖子'),
        imageUrl: null, post, that: this,
      })
    }

    return {
      url: '/pages/index/index?id=123',
      title: '推荐二楼的' + this.data.name + '主题板块',
      success: () => {
        // this.setData({ hideSharePanel: {} });
      },
      fail: () => {
        // this.setData({ hideSharePanel: {} });
      },
    }
  },

  //在主题详情页加载更多的帖子
  onReachBottom: function () {
    const lastPost = (this.data.posts || []).slice(-1)[0] || {};
    const topicId = lastPost.topic.id;
    const score = lastPost.score;
    const timestamp = lastPost.postDate;
    const sortType = this.data.sortTypes[this.data.sortTypeIndex].type;
    if (sortType == "SCORE") {
      getMorePostsByStore(lastPost.topic.id, score).then(data => {
        if (data.data.length === 0) {
          return;
        }

        this.setData({
          posts: [...this.data.posts, ...data.data],
        })
      })
    } else {
      getMorePostsByTime(lastPost.topic.id, timestamp).then(data => {
        if (data.data.length === 0) {
          return;
        }

        this.setData({
          posts: [...this.data.posts, ...data.data],
        })
      })
    }
  },

  onShareImageSavedOrPreviewed: function() {
    this.onShareAppMessage({}).success();
  },

  onSortTypeChange: function (e) {
    this.setData({ sortTypeIndex: e.detail.value })
    this.onPullDownRefresh();
  },
})