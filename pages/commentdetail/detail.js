// pages/commentdetail/detail.js

const PAGE_SIZE = 15;

import {
  getOpenId,
  getComment,
  addReply,
  like,
  dislike,
  reportReply,
  deleteReply,
  deleteComment,
  reportComment,
  getMoreReply,
  recordFormId,
} from '../../data.js';
import {
  formatFriendlyTime, rightSwipeDebuger, attrs, onCopyContent, countLetter
} from '../../utils/util.js';

Page({
  data: {
    commentDateString: '',
    images: [],
    bottomLoading: false,
    isLastPageFull: false,
    sendEnabled: true,
    maxInputLength: 256,
    isAddBottomPadding: global.isAddBottomPadding,
    styleMap: {},
  },

  ...rightSwipeDebuger,
  onCopyContent,

  onLoad: function(options) {
    const commentId = options.commentId || 164;
    getComment(commentId).then(comment => {
      comment.commentDateString = formatFriendlyTime(comment.commentDate);
      comment.replies.forEach(reply => {
        reply.replyDateString = formatFriendlyTime(reply.replyDate);
      })
      const isLastPageFull = comment.replies.length === PAGE_SIZE;
      this.setData({ comment, isLastPageFull })
    });

    const showHomeBtn = getCurrentPages().length === 1;
    this.setData({ showHomeBtn });
  },
  onPreviewImage: function(e) {
    const imageUrl = e.currentTarget.dataset.src;
    wx.previewImage({
      urls: [imageUrl],
    })
  },
  onInputFocus: function() {
    this.setData({
      focused: true
    })
  },
  onInputBlur: function() {
    this.setData({
      focused: false
    })
  },
  onImagesChange: function(e) {
    console.log('images change', e.detail);
    const images = e.detail.images;
    this.setData({
      images
    });
  },
  onImagesSelectStart: function() {
    this.setData({
      selectingImage: true
    });
  },
  onImagesSelectEnd: function() {
    this.setData({
      selectingImage: false
    });
  },
  onInputChange: function(e) {
    const content = e.detail.value;
    this.setData({
      content
    });
  },
  onAddReply: function(e) {
    const formId = e.detail.formId;
    recordFormId(formId);

    if (!this.data.content && this.data.images.length === 0) {
      wx.showToast({
        icon: 'none',
        title: '还未填写任何内容',
      });
      return;
    }

    if (!this.data.sendEnabled) {
      return;
    }

    const length = countLetter(this.data.content);
    if (length > this.data.maxInputLength) {
      wx.showToast({ icon: 'none', title: '超过最长字数限制', });
      return;
    }

    const commentId = this.data.comment.id;

    this.setData({ sendEnabled: false });
    addReply({
      ...this.data,
      replyTo: (this.data.replyToAuthor || {}).openId,
      commentId: this.data.comment.id,
      formId,
    }).then(res => {
      // console.log('回复的res', res);
      // getComment(commentId, { silent: true }).then(comment => {
      //   comment.commentDateString = formatFriendlyTime(comment.commentDate);
      //   comment.replies.forEach(reply => {
      //     reply.replyDateString = formatFriendlyTime(reply.replyDate);
      //   })
      //   this.setData({ comment });
      // });
      this.setData({
        content: '',
        images: [],
        focused: false,
        sendEnabled: true,
      });
      this.onClearReply();
      // getApp().globalData.shouldLoadReplies = true;
      wx.showToast({ title: '回复成功！' })

      if (!this.data.isLastPageFull) {
        const repliesLength = attrs(this.data.comment, 'replies', 'length') || 0;
        if (repliesLength % 15 < 14 || (repliesLength + 1) % 15 === 0) {
          this.onReachBottom();
        }
      }
    }).catch(() => {
      this.setData({ sendEnabled: true });
    });
  },

  onReplyTo: function(e) {
    const replyIndex = e.currentTarget.dataset.index;
    const reply = this.data.comment.replies[replyIndex];
    this.setData({
      commentId: this.data.comment.id,
      replyToAuthor: reply.author,
      focused: true,
    })
  },
  onClearReply: function() {
    this.setData({
      replyToAuthor: null,
      commentId: null
    });
  },

  //点赞
  contentLike: function(e) {
    const { id, type } = e.currentTarget.dataset;
    this._updateContentLike(id, type, true);
    like(type, id).catch(() => {
      wx.showToast({ icon: 'none', title: '点赞失败' });
      this._updateContentLike(id, type, false);
    });
  },

  //取消赞
  contentDislike: function(e) {
    const { id, type } = e.currentTarget.dataset;
    this._updateContentLike(id, type, false);
    dislike(type, id).catch(() => {
      wx.showToast({ icon: 'none', title: '取消赞失败' });
      this._updateContentLike(id, type, true);
    });
  },

  _updateContentLike: function(id, type, isLiked) {
    const comment = this.data.comment;
    if (type === "comment") {
      comment.isLiked = isLiked;
      comment.likeCount += isLiked ? +1 : -1;
      this.setData({ comment });
      global.trigger('commentUpdated', comment);
    } else {
      const reply = this.data.comment.replies.find(r => r.id === id);
      reply.isLiked = isLiked;
      reply.likeCount += isLiked ? +1 : -1;
      this.setData({ comment });
    }
  },

  //回复的功能按钮
  onShowMenueReply: function(e) {
    getOpenId().then(selfOpenId => {
      const {
        id,
        openId
      } = e.currentTarget.dataset;
      const isSelfReply = selfOpenId === openId;
      console.log("openId", openId);
      console.log("selfOpenId", selfOpenId);
      wx.showActionSheet({
        itemList: [isSelfReply ? '删除' : '举报'],
        success: res => {
          console.log('action sheet', res);
          isSelfReply ? this._removeReply(id) : this._reportReply(id);
        }
      })
    })
  },

  _removeReply: function(id) {
    wx.showModal({
      content: '确认删除？',
      success: res => {
        if (res.confirm) {
          deleteReply(id);
          wx.showToast({
            title: '已删除',
          })
          const comment = this.data.comment;
          const replyIndex = comment.replies.findIndex(r => r.id === id);
          comment.replies.splice(replyIndex, 1);
          this.setData({ comment });
          //getApp().globalData.shouldLoadReplies = true;
          global.trigger('commentUpdated', comment);
        }
      }
    })
  },

  _reportReply: function(id) {
    wx.showModal({
      content: '确认举报？',
      success: res => {
        if (res.confirm) {
          reportReply(id);
          wx.showToast({
            title: '已举报',
          })
        }
      }
    })
  },



  //评论的功能按钮
  onShowMenueComment: function(e) {
    getOpenId().then(selfOpenId => {
      const {
        id,
        openId
      } = e.currentTarget.dataset;
      const isSelfComment = selfOpenId === openId;
      console.log("openId", openId);
      console.log("selfOpenId", selfOpenId);
      wx.showActionSheet({
        itemList: [isSelfComment ? '删除' : '举报'],
        success: res => {
          console.log('action sheet', res);
          isSelfComment ? this._removeComment(id) : this._reportComment(id);
        }
      })
    })
  },

  _removeComment: function(id) {
    wx.showModal({
      content: '确认删除？',
      success: res => {
        if (res.confirm) {
          deleteComment(id);
          wx.showToast({ title: '已举报', })
          wx.navigateBack({})
          // getApp().globalData.shouldLoadReplies = true;
          global.trigger('commentDeleted', id);
        }
      }
    })
  },

  _reportComment: function(id) {
    wx.showModal({
      content: '确认举报？',
      success: res => {
        if (res.confirm) {
          reportComment(id);
          wx.showToast({ title: '已举报', })
        }
      }
    })
  },

  //评论详情页的加载更多，拉取更多的回复，最后一个回复的时间戳请求
  onReachBottom: function() {
    if (this.onReachBottomPromise) {
      return;
    }
    const lastReply = (this.data.comment.replies || []).slice(-1)[0] || {};
    this.setData({ bottomLoading: true })
    this.onReachBottomPromise = getMoreReply(lastReply.commentId, lastReply.replyDate, { silent: true }).then(data => {
      this.setData({ bottomLoading: false })
      if (data.data.length === 0) {
        return;
      }

      const comment = this.data.comment;
      comment.replies = comment.replies.concat(data.data);
      const isLastPageFull = comment.replies.length === PAGE_SIZE;      

      this.setData({ comment, isLastPageFull })

      global.trigger('commentUpdated', comment);
    })
    .then(() => delete this.onReachBottomPromise)
    .catch(() => delete this.onReachBottomPromise)
  },
  onSelectImage: function() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({
          images: res.tempFilePaths
        });
      },
    })
  },

  onImageLoad: function (e) {
    const { width, height } = e.detail;
    const { styleKey } = e.currentTarget.dataset;
    console.log('comment.onImageLoad', width, height);

    let style = '';
    //横图，固定高度100，宽度自适应。最宽180
    if (width > height) {
      const imageHeight = 100;
      const imageWidth = width * imageHeight / height;
      style = `width: ${imageWidth}px; height: ${imageHeight}px; max-width: 180px;`;
    }
    //竖图，固定高度180，宽度自适应。
    else {
      const imageHeight = 180;
      const imageWidth = width * imageHeight / height;
      style = `width: ${imageWidth}px; height: ${imageHeight}px; max-width: 180px; max-height: 180px;`;
    }
    this.data.styleMap[styleKey] = style;
    this.setData({ styleMap: this.data.styleMap });
  },

})