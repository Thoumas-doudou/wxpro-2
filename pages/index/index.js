//index.js
import { getHotTopics, getSendContentEnabled } from '../../data.js';
import { getFirstRecommend, getRecommend, getRecommendHistory, getPostIds, getPostsByIds } from '../../data.js';
import { handleSharePost, listenToPostChanges, unlistenToPostChanges } from '../../utils/helper.js';

const REMOVE_POSTS_THRESHOLD = 500;
const POSTS_TO_REMOVE = 400;
const PAGE_SIZE = 15;

Page({
  data: {
    posts: [],
    postIds: [],
    bottomLoading: false,
    lastPost: null,
    sendContentEnabled: false,
    hideSharePanel: {},
  },

  onLoad: function (options) {
    // const sharedUrl = getApp().globalData.sharedUrl;
    const sharedUrl = global.sharedUrl;
    if (sharedUrl) {
      console.log('navigating to sharedUrl', sharedUrl);
      delete global.sharedUrl;
      wx.navigateTo({ url: sharedUrl, });
    }
    this.initialize();
    listenToPostChanges(this);
  },

  initialize: function () {
    console.log('initialize...');

    getHotTopics().then(hotTopics => {
      try {
        console.log('hotTopics', hotTopics);
        this.setData({ topics: hotTopics });
      } catch (e) {
        console.error('error!', e);
        throw e;
      }
    })

    // 先拉取帖子id列表。然后一页一页地批量拉帖子详情
    this.loadFirstPageData();
    getSendContentEnabled().then(sendContentEnabled => this.setData({ sendContentEnabled }));
  },

  loadFirstPageData: function() {
    wx.showLoading({})
    getPostIds().then(postIds => {
      this.setData({ postIds });
      const currentPostIds = postIds.slice(0, PAGE_SIZE);
      return getPostsByIds(currentPostIds).then(posts => ({ posts, postCount: currentPostIds.length }));
    }).then(({ posts, postCount }) => {
      const postIds = this.data.postIds.slice(postCount);
      this.setData({ posts, postIds });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    }).catch(e => {
      console.error(e);
      wx.hideLoading();
      wx.stopPullDownRefresh();
    });
  },

  onUnload: function() {
    unlistenToPostChanges(this);
  },

  //这个事件会由帖子详情页触发
  onPostUpdated: function(post) {
    console.log('post updated', post, this);
    if (!this.data.posts) {
      return;
    }
    const postIndex = this.data.posts.findIndex(p => p.id === post.id);
    if (postIndex >= 0) {
      this.data.posts[postIndex] = post;
      this.setData({ posts: this.data.posts });
    }
  },

  onPostDeleted: function (id) {
    const postIndex = this.data.posts.findIndex(p => p.id === id);
    if (postIndex >= 0) {
      this.data.posts.splice(postIndex, 1);
      this.setData({ posts: this.data.posts });
    }
  },

  onShow: function() {
    if (getApp().globalData.shouldLoadNewData) {
      this.onPullDownRefresh();
      getApp().globalData.shouldLoadNewData = false;
    }

    //这个sharePost是给分享时截图用的，分享完要清掉
    this.setData({ sharePost: 0 });
  },

  onLikeChange: function(e) {
    console.log('like changed', e.detail);
    const { id, isLiked } = e.detail;
    const post = this.data.posts.find(p => p.id === id);
    post.isLiked = isLiked;
    post.likeCount += isLiked ? +1 : -1;
    this.setData({ posts: this.data.posts });
  },

  //下拉刷新，获取新的推荐并放在前面
  onPullDownRefresh: function () {
    this.loadFirstPageData();
  },

  //因为有些post可能是无效的(被删掉的在列表中为空)，我们要找到最后一个有效的post
  getLastPost: function() {
    for(let i = this.data.posts.length - 1; i >= 0; --i) {
      const post = this.data.posts[i];
      if (post && typeof post.id === 'number') {
        return post;
      }
    }
    return null;
  },

  onReachBottom: function() {
    if (this.data.bottomLoading) {
      return;
    }
    const lastPost = this.getLastPost() || {};
    const lastScore = lastPost.score;

    this.setData({ bottomLoading: true });
    new Promise((resolve, reject) => {
      const pageStart = this.data.posts.length;
      const postIds = this.data.postIds.slice(0, PAGE_SIZE);
      console.log('postIds size=', this.data.postIds.length,
        'next page size:', postIds.length, '(', postIds.join(','), ') remaining');
      return getPostsByIds(postIds).then(posts => resolve({posts, postCount: postIds.length})).catch(reject);
    }).then(({posts, postCount}) => {
      //postCount有可能大于posts，因为部分帖子如果被删掉，则后台不会返回在posts中
      this.data.posts = this.data.posts.concat(posts);
      if (this.data.posts.length > REMOVE_POSTS_THRESHOLD) {
        this.data.post = this.data.post.slice(0, POSTS_TO_REMOVE);
      }
      this.setData({ posts: this.data.posts });

      console.log('page size is', postCount);
      const postIds = this.data.postIds.slice(postCount);
      this.setData({ postIds });
      if (postIds.length === 0) {
        console.log('postIds empty, fetching new IDs');
        const lastPost = this.data.posts.slice(-1)[0] || {};
        getPostIds(lastPost.score).then(postIds => {
          this.setData({ postIds });
        });
      }
    }).then(() => {
      this.setData({ bottomLoading: false })
    }).catch(() => {
      this.setData({ bottomLoading: false })
    })
  },

  onShareAppMessage: function(e) {
    const { id, content, imageUrls, isShared, nickName } = (e.target || {}).dataset || {};
    if (e.from === 'button') {
      const post = this.data.posts.find(p => p.id === id);
      this.setData({ sharePost: post });
      
      return handleSharePost({
        id, isShared,
        title: nickName + ': ' + (content || '发表帖子'),
        imageUrl: null, post, that: this,
      })
    }
  },
})
