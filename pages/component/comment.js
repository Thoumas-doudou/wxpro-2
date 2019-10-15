// pages/component/comment.js
// pages/component/post.js
import { formatFriendlyTime, rightSwipeDebuger, onCopyContent, } from "../../utils/util.js";
import { like, dislike, share, unshare } from '../../data.js';
import { getOpenId, deleteComment, reportComment } from '../../data.js';


Component({
  properties: {
    navigateToComment: Boolean,
    comment: {
      type: Object,
      value: {},
      observer: function (newVal, oldVal, changedPath) {
        if (!this.properties.comment) {
          return;
        }
        const { id } = this.properties.comment;
        this.setData(this.properties.comment);
        const commentDateString = formatFriendlyTime(this.properties.commentDate);
        this.setData({ commentDateString });
        // const images = this.properties.comment.images.filter(Boolean).map((image, index) => {
        //   if (!/^\w+:\/\//.test(image)) {
        //     return `http://oss.matrixsci.cn/bycircle/comment/${id}/${index}.${image}`;
        //   }
        //   return image;
        // });
        // console.log('[component] comment data', this.data);
        // this.setData({ images });
      }
    },
  },

  data: {
  },

  methods: {
    ...rightSwipeDebuger,
    onCopyContent,
    
    onPreviewImage: function (e) {
      const { src, images } = e.currentTarget.dataset;
      wx.previewImage({
        current: src,
        urls: images || [src],
      })
    },
    onClickComment: function () {
      if (this.isLongTap) { this.isLongTap = false; return; }      
      const url = `/pages/commentdetail/detail?commentId=${this.data.id}`;
      wx.navigateTo({ url, });
    },
    commentLike: function (e) {
      const { id } = e.currentTarget.dataset;
      like("comment", id).catch(() => {
        wx.showToast({ icon: 'none', title: '点赞失败' });
        this.triggerEvent('likechange', { id, isLiked: false });
      });
      this.triggerEvent('likechange', { id, isLiked: true });
    },

    commentDislike: function (e) {
      const { id } = e.currentTarget.dataset;
      dislike("comment", id).catch(() => {
        wx.showToast({ icon: 'none', title: '取消赞失败' });
        this.triggerEvent('likechange', { id, isLiked: true });
      });
      this.triggerEvent('likechange', { id, isLiked: false });
    },

    postShare: function (e) {
      const id = e.currentTarget.dataset.id;
      wx.showShareMenu();
      share("post", id).then(response => {
        const shareCount = this.data.shareCount + 1;
        this.setData({ shareCount, isShared: true });
      });
    },

    postShareAgain: function (e) {
      const id = e.currentTarget.dataset.id;
      wx.showShareMenu();
    },

    postUnshare: function (e) {
      const id = e.currentTarget.dataset.id;
      unshare("post", id).then(response => {

      });
    },

    onShowMenue: function () {
      getOpenId().then(openId => {
        const isSelfComment = openId === this.data.author.openId;
        const id = this.data.id;
        wx.showActionSheet({
          itemList: [isSelfComment ? '删除' : '举报'],
          success: res => {
            console.log('action sheet', res);
            isSelfComment ? this._removeComment(id) : this._reportComment(id);
          }
        })
      })
    },

    _removeComment: function (id) {
      console.log('TODO: 实现删除评论的功能', id);
      wx.showModal({
        content: '确认删除？',
        success: res => {
          if (res.confirm) {
            deleteComment(id);
            this.triggerEvent('deletecomment', id);
          }
        }
      })
    },

    _reportComment: function (id) {
      console.log('TODO: 实现举报评论的功能', id);
      wx.showModal({
        content: '确认举报？',
        success: res => {
          if (res.confirm) {
            reportComment(id);
          }
        }
      })
    },

    onReplyTo: function() {
      const id = this.data.id;
      const replyToAuthor = this.data.author;
      this.triggerEvent('replyto', {id, replyToAuthor });
    },


    onPreviewImage: function(e) {
      const images = e.currentTarget.dataset.images;
      wx.previewImage({ urls: images, });
    },

    onSeeAllComments: function() {
      wx.navigateTo({
        url: '/pages/commentdetail/detail?commentId='+this.data.id,
      })
    },

    onImageLoad: function(e) {
      const { width, height } = e.detail;
      console.log('comment.onImageLoad', width, height);

      let style = '';
      //横图，固定高度100，宽度自适应。最宽180
      if (width > height) {
        const imageHeight = 100;
        const imageWidth = width * imageHeight / height;
        style = `width: ${imageWidth}px; height: ${imageHeight}px; max-width: 180px;`;
      }
      //竖图，固定高度150，宽度自适应。最小宽度80
      else {
        const imageHeight = 150;
        const imageWidth = width * imageHeight / height;
        style = `width: ${imageWidth}px; height: ${imageHeight}px; max-width: 150px; max-height: 150px; min-width: 60px`;
      }
      this.setData({ style });

      this.triggerEvent('imageload', e.detail);
    },
    onEmptyFunction: function() {}
  }
})
