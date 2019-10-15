// pages/post/post.js
import {
  getPost, addComment, addReply, like, dislike, share, getMoreComments,
  recordFormId,
  getQrcodeImageUrl, getPostQrcodeImageUrl
} from '../../data.js';
import { handleSharePost, listenToCommentChanges, unlistenToCommentChanges } from '../../utils/helper.js';
import { countLetter, attrs } from '../../utils/util.js';

const REMOVE_COMMENTS_THRESHOLD = 500;
const COMMENTS_TO_REMOVE = 400;

Page({
  data: {
    content: '',
    images: [],
    loading: true,
    bottomLoading: false,
    focused: false,
    sendEnabled: true,
    maxInputLength: 256,
    isAddBottomPadding: global.isAddBottomPadding,
    generateImageUrl: '',
    showSharePanel: false,
    hideSharePanel: {},
    isAndroid: false,
  },

  onLoad: function (options) {
    const id = options.id || 78;
    const autoFocus = options.autoFocus || false;
    this.setData({ autoFocus });

    this.imagesToWaitBeforeScroll = 0;
    this.imagesLoadedBeforeScroll = 0;

    this.loadPostData(id).then(() => {
      const post = this.data.post || {};
      if (autoFocus && post && (!post.comments || post.comments.length === 0)) {
        this.setData({ focused: true });
        return;
      }
      
      console.log("attrs(post, 'images', 'length')", (post.images.length));
      if (attrs(post, 'images', 'length') === 1) {
        this.imagesToWaitBeforeScroll++;
      }
      this.imagesToWaitBeforeScroll += attrs(post, 'hotComments', 0, 'images', 'length') || 0;
      
      if (this.imagesToWaitBeforeScroll === 0) {
        this.scrollToComments();
      }
    });

    if (getCurrentPages().length == 1) {
      this.setData({ showHomeBtn: true })
      this.setData({ loading: false });
    }
    listenToCommentChanges(this);

    this.setData({
      // generateImageUrl: getQrcodeImageUrl('/pages/post/post?id=' + id),
      generateImageUrl: getPostQrcodeImageUrl(id),
    })

    var phone = wx.getSystemInfoSync();  //调用方法获取机型
    if (phone.platform == 'android') {
      this.isAndroid = true;
    } else {
      this.isAndroid = false;
    } 
    this.setData({ isAndroid: this.isAndroid});
  },

  onUnload: function() {
    unlistenToCommentChanges(this);
  },

  onShow: function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.timeout = setTimeout(() => {
      if (!this.data.selectingImage && getApp().globalData.shouldLoadReplies && this.data.post) {
        this.loadPostData(this.data.post.id);
        getApp().globalData.shouldLoadReplies = false;
      }

      this.timeout = null;
    }, 100);
  },

  onPullDownRefresh: function () {
    this.loadPostData(this.data.post.id);
    wx.stopPullDownRefresh();
  },

  onHotCommentImageLoad: function(e) {
    console.log('onHotCommentImageLoad', e);
    this.checkImagesAndScrollToComments();
  },

  onPostImageLoad: function(e) {
    console.log('onPostImageLoad', e);
    if (attrs(this.data.post, 'images', 'length') === 1) {
      this.checkImagesAndScrollToComments();
    }
  },

  checkImagesAndScrollToComments: function () {
    this.imagesLoadedBeforeScroll++;
    console.log('checkImagesAndScrollToComments', this.imagesToWaitBeforeScroll, this.imagesLoadedBeforeScroll);
    if (this.imagesToWaitBeforeScroll && this.imagesLoadedBeforeScroll >= this.imagesToWaitBeforeScroll) {
      this.scrollToComments();
    }
  },

  scrollToComments: function () {
    console.log('autoFocus', this.data.autoFocus);
    this.data.autoFocus && wx.createSelectorQuery().select('#all-comments').boundingClientRect(rect => {
      console.log('all-comments top', rect.top);
      wx.pageScrollTo({ scrollTop: rect.top })
    }).exec();
  },

  loadPostData: function(id) {
    return getPost(id).then(post => this.setData({ post, }));
  },

  onInputFocus: function () { this.setData({ focused: true, showAddImageBtn: true }) },
  onInputBlur: function () {
    this.setData({ focused: false });
    setTimeout(() => this.setData({ showAddImageBtn: false }), 10);

    if (this.data.content === '' && (!this.data.selectingImage || this.data.images.length > 0)) {
      this.setData({ replyToAuthor: null });
    }
  },
  onImagesChange: function(e) {
    console.log('images change', e.detail);
    const images = e.detail.images;
    this.setData({ images });
  },
  onImagesSelectStart: function() {
    this.setData({ selectingImage: true });
  },
  onImagesSelectEnd: function() {
    this.setData({ selectingImage: false });
  },
  onInputChange: function(e) {
    const content = e.detail.value;
    this.setData({ content });
  },
  onSelectImage: function() {
    this.setData({ selectingImage: true });
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({ images: res.tempFilePaths, selectingImage: false });
      },
      fail: () => {
        this.setData({ selectingImage: false });
      },
    })
  },
  onAddComment: function(e) {
    const formId = e.detail.formId;
    recordFormId(formId);

    if (!this.data.post) {
      return;
    }

    if (!this.data.content && this.data.images.length === 0) {
      wx.showToast({ icon: 'none', title: '还未填写任何内容', });
      return;
    }

    const length = countLetter(this.data.content);
    if (length > this.data.maxInputLength) {
      wx.showToast({ icon: 'none', title: '超过最长字数限制', });
      return;
    }

    if (!this.data.sendEnabled) {
      return;
    }

    if (this.data.commentId && this.data.replyToAuthor) {
      return this._addReply(e);
    }
    
    this.setData({ sendEnabled: false });
    addComment({
      ...this.data,
      postId: this.data.post.id,
      formId,
    }).then(res => {
      this.setData({ sendEnabled: true });
      const post = this.data.post;
      post.commentCount ++;
      post.comments = [res.data].concat(post.comments);
      this.setData({ post });
      // getPost(this.data.post.id, { silent: true }).then(post => this.setData({ post }));
      this.setData({ content: '', images: [], focused: false });
      wx.showToast({ title: '评论成功！', });
      global.trigger('postUpdated', post);
    }).catch((e) => {
      console.error(e);
      this.setData({ sendEnabled: true });
    });
  },

  _addReply: function (e) {
    const formId = e.detail.formId;
    this.setData({ sendEnabled: false });
    addReply({
      ...this.data,
      //这里发表的回复应该就是评论的回复，不需要加replyTo.这个replyTo的意思是在回复的回复时才会用
      // replyTo: this.data.replyToAuthor.openId,
      commentId: this.data.commentId,
      formId,
    }).then(res => {
      this.setData({ sendEnabled: true });
      // getPost(this.data.post.id, { silent: true }).then(post => this.setData({ post }));
      const post = this.data.post;
      const comment = post.comments.find(c => c.id === this.data.commentId);
      if (comment) {
        comment.replies = comment.replies || [];
        comment.replies.push(res.data);
      }
      const hotComment = post.hotComments.find(c => c.id === this.data.commentId);
      if (hotComment) {
        hotComment.replies = hotComment.replies || [];
        hotComment.replies.push(res.data);
      }
      
      this.setData({ post });

      this.setData({ content: '', images: [], focused: false });
      this.onClearReply();
      wx.showToast({ title: '回复成功！' })
    }).catch((e) => {
      console.error(e);
      this.setData({ sendEnabled: true });
    });
  },

  onReplyTo: function(e) {
    const { id, replyToAuthor } = e.detail;
    this.setData({
      commentId: id,
      replyToAuthor,
      focused: true,
    })
  },
  onClearReply: function() {
    this.setData({ replyToAuthor: null, commentId: null });
  },
  postLike: function() {
    const post = this.data.post;
    if (!post) { return; }
    like('post', post.id).catch(() => {
      wx.showToast({ icon: 'none', title: '点赞失败' });
      post.isLiked = false;
      post.likeCount--;
      this.setData({ post });
      global.trigger('postUpdated', post);
    });
    post.isLiked = true;
    post.likeCount++;
    this.setData({ post });
    global.trigger('postUpdated', post);
  },
  postDislike: function () {
    const post = this.data.post;
    if (!post) { return; }
    dislike('post', post.id).catch(() => {
      wx.showToast({ icon: 'none', title: '取消赞失败' });
      post.isLiked = true;
      post.likeCount++;
      this.setData({ post });
      global.trigger('postUpdated', post);
    });
    post.isLiked = false;
    post.likeCount--;
    this.setData({ post });
    global.trigger('postUpdated', post);
  },
  onShareAppMessage: function(e) {
    const post = this.data.post;
    if (!post) { return; }
    const title = post.author.nickName + ': ' + (post.content||'发表帖子');
    const imageUrl = null; //(post.images||[])[0];
    return handleSharePost({...post, title, imageUrl, that: this, success: () => {
      post.isShared = true;
      post.shareCount++;
      this.setData({ post });
      global.trigger('postUpdated', post);
    }});
  },

  onLikeChange: function (e) {
    console.log('post page -- like changed', e.detail);
    const { id, isLiked } = e.detail;
    const post = this.data.post;
    const comment = post.comments.find(p => p.id === id);
    if (comment) {
      comment.isLiked = isLiked;
      comment.likeCount += isLiked ? +1 : -1;
    }
    const hotComment = post.hotComments.find(p => p.id === id);
    if (hotComment) {
      hotComment.isLiked = isLiked;
      hotComment.likeCount += isLiked ? +1 : -1;
    }
    
    this.setData({ post });
  },

  //在内容详情页加载更多的评论
  onReachBottom: function () {
    if (this.getMoreCommentsPromise || !this.data.post) {
      return;
    }
    const lastComment = (this.data.post.comments || []).slice(-1)[0] || {};
    if (!lastComment.postId) {
      return;
    }
    this.setData({ bottomLoading: true })
    this.getMoreCommentsPromise = getMoreComments(lastComment.postId, lastComment.commentDate, { silent: true }).then(data => {
      this.setData({ bottomLoading: false })
      if (data.data.length === 0) {
        return;
      }
      const post = this.data.post;

      post.comments = post.comments.concat(data.data);

      //暂时修复评论数过多导致数据量超过1M无法set的bug：如果超过一定数量，就把前面的N条评论忽略。
      if (post.comments.length > REMOVE_COMMENTS_THRESHOLD) {
        post.comments = post.comments.slice(COMMENTS_TO_REMOVE);
      }

      this.setData({ post })
    })
    .then(() => delete this.getMoreCommentsPromise)
    .catch(() => delete this.getMoreCommentsPromise)
  },

  onDeleteComment: function(e) {
    const id = e.detail;
    const post = this.data.post;
    const commentIndex = post.comments.findIndex(c => c.id === id);
    post.commentCount--;
    post.comments.splice(commentIndex, 1);
    this.setData({ post });
    global.trigger('postUpdated', post);
  },

  onShareBtnClick: function() {
    this.setData({ showSharePanel: true, });
  },

  onShowSharePanel: function() {
    this.setData({ showSharePanel: true });
  },

  onHideSharePanel: function () {
    this.setData({ showSharePanel: false });
  },

  onShareImageSavedOrPreviewed: function () {
    this.onShareAppMessage().success();
  }
})