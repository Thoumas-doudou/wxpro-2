import {
  getUserInfoByOpenId,
  getPostByUser
} from '../../data.js';
//import '../../mock/data/getUserInfo.js';
import { handleSharePost, listenToPostChanges, unlistenToPostChanges } from '../../utils/helper.js';

Page({
  data: {
    nickName: '',
    sign: '',
    loading: true,
    avatarUrl: '',
    likedCount: 0,
    postCount: 0,
    allPostCount: 0,
    posts: [],
    openId: '',
  },

  onShow: function(options) {},

  onLoad: function(options) {
    const openId = options.openId || "oZfMZ0f_K0YEQpUdJBetY5f3GnJY";
    this.setData({openId});
    console.log("canshu: ", this.data.openId);
    getUserInfoByOpenId(openId).then(userInfo => {
      console.log('userInfo', userInfo);
      this.setData({
        ...userInfo.data,
      })
    });

    let lastTimestamp = new Date().getTime();
    getPostByUser(openId, lastTimestamp).then(res => {
      console.log("postData", res);
      this.setData({
        posts: res.data
      });
    })

    listenToPostChanges(this);
  },

  onUnload: function() {
    console.log('==== onUnload', this);
    unlistenToPostChanges(this);
  },

  onReachBottom: function() {
    if (this.getPostByUserPromise) {
      return;
    }
    let lastTimestamp = undefined;

    if (this.data.posts.length > 0) {
      lastTimestamp = this.data.posts.slice(-1)[0].postDate;
    }
    //获取消息列表
    this.getPostByUserPromise = getPostByUser(this.data.openId, lastTimestamp).then(res => {
      console.log("res", res);
      if (res.data.length === 0) {
        wx.showToast({
          icon: 'none',
          title: '没有新的内容了',
        })
        return;
      }
      this.setData({
        posts: this.data.posts.concat(res.data)
      });
    })
    .then(() => delete this.getPostByUserPromise)
    .catch(() => delete this.getPostByUserPromise)
  },

  onLikeChange: function (e) {
    console.log('like changed', e.detail);
    const { id, isLiked } = e.detail;
    const post = this.data.posts.find(p => p.id === id);
    post.isLiked = isLiked;
    post.likeCount += isLiked ? +1 : -1;
    this.setData({ posts: this.data.posts });
  },

  onPreviewAvatar: function() {
    wx.previewImage({
      urls: [this.data.avatarUrl],
    })
  }
})