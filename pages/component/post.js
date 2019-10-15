// pages/component/post.js
import {
  formatFriendlyTime,
  rightSwipeDebuger,
  onCopyContent,
  jumpToUrl
} from "../../utils/util.js";
import {
  like,
  dislike,
  share,
  unshare,
  getPostQrcodeImageUrl,
  recordFormId,
} from '../../data.js';
import {
  getOpenId,
  deletePost,
  reportPost
} from '../../data.js';

Component({
  properties: {
    navigateToPost: Boolean,
    maxImages: {
      type: Number,
      value: 3,
    },
    post: {
      type: Object,
      value: {},
      observer: function (newVal, oldVal, changedPath) {
        if (!this.properties.post) {
          return;
        }
        const {
          id
        } = this.properties.post;
        this.setData(this.properties.post);
        this.setData({
          post: this.properties.post
        });
        const postDateString = formatFriendlyTime(this.properties.postDate);
        this.setData({
          postDateString
        });

        //图片类型。目前暂时只实现按照后缀来判断。
        const imageTypes = this.properties.post.images.map(image => image.split('.').slice(-1)[0]);
        //是否是长图。需要在imageLoad事件中获得宽高比并赋值
        const isLongImageList = this.properties.post.images.map(() => false);

        // if (this.properties.post.url) {
        // let url = this.properties.post.url.replace(/^http:/, 'https:');
        // if (/https:\/\//.test(url)) {
        //   url = '../webview/webview?src=' + encodeURIComponent(url);
        // }
        // this.setData({ encodedUrl: url });
        // }

        this.setData({
          imageTypes,
          isLongImageList
        });

        this.setData({
          generateImageUrl: getPostQrcodeImageUrl(id)
        });
      }
    },
    showTopicName: {
      type: Boolean,
      value: true
    },
    isShowHotComment: Boolean,
    showImageCount: Boolean,
    collapseTextContent: Boolean,
    collapseImageContent: Boolean,
    dateTimePosition: {
      type: String,
      value: 'top'
    }, //取值 top:在顶部的昵称下方。bottom:在底栏
    bottomBarType: {
      type: String,
      value: 'icon'
    }, //取值 icon:带图标的底栏。text:纯文字的底栏
    newShareStyle: Boolean, //那种会弹出生成海报&分享给朋友的分享样式。
    hideSharePostPanel: {
      type: Object,
      observer: function() {
        this.setData({ hideSharePanel: {} });
      }
    }
  },

  data: {
    hideSharePanel: {},
  },

  methods: {
    ...rightSwipeDebuger,
    onCopyContent,
    onEmptyFunction: function () { },

    onLinkClick: function (e) {
      const url = e.currentTarget.dataset.url;
      this.isSupportDomain(url).then((support) => {
        if (support){
          jumpToUrl(url);
        }
        else {
          wx.showModal({
            content: '当前链接无法在小程序中打开，需复制后在浏览器中打开”',
            confirmText: '复制链接',
            success(res) {
              if (res.confirm) {
                wx.setClipboardData({
                  data: url
                })
              } 
            }
          })
        }
      });
    },

    isSupportDomain(url) {
      const hostname = this.extractHostname(url);
      return wx.cloud.callFunction({
        name: 'getSupportedDomain',
        data: {},
      }).then(res => {
        return res.result.includes(hostname);
      }).catch(e => {
        console.log('testHelloWorld error:', e);
        throw e;
      })
    },
    extractHostname(url) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname

      if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
      } else {
        hostname = url.split('/')[0];
      }

      //find & remove port number
      hostname = hostname.split(':')[0];
      //find & remove "?"
      hostname = hostname.split('?')[0];

      return hostname;
    },

    onPreviewImage: function (e) {
      const {
        src,
        images
      } = e.currentTarget.dataset;
      wx.previewImage({
        current: src,
        urls: images || [src],
      })
    },
    onClickPost: function () {
      if (this.isLongTap) {
        this.isLongTap = false;
        return;
      }
      if (!this.properties.navigateToPost) {
        return;
      }
      const url = `/pages/post/post?id=${this.data.id}`;
      wx.navigateTo({
        url,
      });
    },
    postLike: function (e) {
      const id = this.properties.post.id;
      like("post", id).catch(() => {
        this.triggerEvent('likechange', {
          id,
          isLiked: false
        });
        wx.showToast({
          icon: 'none',
          title: '点赞失败'
        });
      });

      this.triggerEvent('likechange', {
        id,
        isLiked: true
      });
    },

    postDislike: function (e) {
      const id = this.properties.post.id;
      dislike("post", id).catch(() => {
        this.triggerEvent('likechange', {
          id,
          isLiked: true
        });
        wx.showToast({
          icon: 'none',
          title: '取消赞失败'
        });
      });

      this.triggerEvent('likechange', {
        id,
        isLiked: false
      });
    },

    postShare: function (e) {
      const id = e.currentTarget.dataset.id;
      wx.showShareMenu();
      share("post", id).then(response => {
        const shareCount = this.data.shareCount + 1;
        this.setData({
          shareCount,
          isShared: true
        });
      });
    },

    postShareAgain: function (e) {
      const id = e.currentTarget.dataset.id;
      wx.showShareMenu();
    },

    onShowMenue: function () {
      getOpenId().then(openId => {
        const isSelfPosted = openId === this.data.author.openId;
        const id = this.data.id;
        wx.showActionSheet({
          itemList: [isSelfPosted ? '删除' : '举报'],
          success: res => {
            console.log('action sheet', res);
            isSelfPosted ? this._removePost(id) : this._reportPost(id);
          }
        })
      })
    },

    _removePost: function (id) {
      console.log('TODO: 实现删除帖子的功能', id);

      wx.showModal({
        content: '确认删除？',
        success: res => {
          if (res.confirm) {
            deletePost(id);
            wx.showToast({
              title: '已删除',
            })
            wx.navigateBack({});
            getApp().globalData.shouldLoadNewData = true;
            global.trigger('postDeleted', id);
          }
        }
      })
    },

    _reportPost: function (id) {
      console.log('TODO: 实现举报帖子的功能', id);
      wx.showModal({
        content: '确认举报？',
        success: res => {
          if (res.confirm) {
            reportPost(id);
            wx.showToast({
              title: '已举报',
            })
          }
        }
      })
    },

    onImageLoad: function (e) {
      const {
        width,
        height
      } = e.detail;
      const {
        index,
        src
      } = e.currentTarget.dataset;

      //长图（竖）的判断
      const isLongImage = (height / width > 3) || (width / height > 3);
      this.data.isLongImageList[index] = isLongImage;
      this.setData({
        isLongImageList: this.data.isLongImageList
      });

      //对于单图的帖子，定义图片的宽高行为
      // let imageSizeType = '';
      let imageStyle = `width: ${width}px; height: ${height}px`;
      let imageMode = '';
      //1.长图（竖），高度的高度恒定200px，宽度恒定100px
      if (height / width > 3) {
        imageStyle = `width: 100px; height: 200px`;
        imageMode = 'aspectFill';
      }
      //2.长图（横），高度的高度恒定100px，宽度恒定325px（横向满屏宽度）
      else if (width / height > 3) {
        imageStyle = `width: 325px; height: 100px`;
        imageMode = 'aspectFill';
      }
      //2.5 宽高比在1:1.2或1.2:1以内时，高度恒定200px，宽度按图的比例自动计算。
      else if ((height > width && height / width < 1.2) || (width > height && width / height < 1.2)) {
        const imageHeight = 200;
        const imageWidth = width * (imageHeight / height);
        imageStyle = `width: ${imageWidth}px; height: ${imageHeight}px`;
        imageMode = "scaleToFill";
      }
      //3.竖图，高度恒定为200px，宽度根据图片自己的比例得到一个数字（<200px）
      else if (height > width) {
        const imageHeight = 200;
        const imageWidth = width * (imageHeight / height);
        imageStyle = `width: ${imageWidth}px; height: ${imageHeight}px`;
        imageMode = "scaleToFill";
      }
      //4.横图，高度恒定为156px（发了两张图片时候的高度），宽度根据图片自己的比例得到一个数字（> 156px）
      else if (width > height) {
        const imageHeight = 156;
        const imageWidth = width * (imageHeight / height);
        imageStyle = `width: ${imageWidth}px; height: ${imageHeight}px;`;
        imageMode = "aspectFill";
      }
      //5.正方形图，高和宽恒定200px
      else {
        imageStyle = `width: 200px; height: 200px`;
      }
      this.setData({
        imageStyle,
        imageMode
      })
      // console.debug(src, width, 'x', height);
      // console.log('imageLoad', e, width, height, isLongImage);
      this.triggerEvent('imageload', e.detail)
    },

    onShareImageSavedOrPreviewed: function (e) {
      console.log('onShareImageSavedOrPreviewed', e);
      this.setData({
        hideSharePanel: {}
      });
    },
  },
})