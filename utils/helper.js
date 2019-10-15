import { like, dislike, share, unshare } from '../data.js';

const MAX_SHARE_TITLE_LENGTH = 80;

function emptyFunction() {}

export function handleSharePost({ id, isShared, title, imageUrl, success = emptyFunction, post, that }) {
  console.log('分享帖子', id, isShared);
  wx.hideLoading();
  // 如果要截断分享的title，就把下面的代码注释打开
  // if (title && title.length > MAX_SHARE_TITLE_LENGTH) {
  //   title = title.substr(0, MAX_SHARE_TITLE_LENGTH-3) + '...';
  // }
  return {
    path: `/pages/index/share-router?url=/pages/post/post;id=${id}`,
    title,
    imageUrl,
    success: res => {
      that.setData({ hideSharePanel: {}, });
      if (isShared) {
        return;
      }
      share('post', id).then(() => {
        wx.showToast({ title: '分享成功!', })
      })
      post.isShared = true;
      post.shareCount++;
      post.hideSharePanel = {};
      that.setData({ posts: that.data.posts, sharePost: 0, });
      success();
    },
  }
}

export function onUserInfoUpdated(userInfo) {
  // const userInfoRes = wx.getStorageSync('userInfoRes');
  // const userInfo = userInfoRes.data;
  console.log('onUserInfoUpdated', userInfo);
  if (userInfo) {
    this.data.posts.forEach(post => {
      console.log('onUserInfoUpdated searching post', post);
      if (post.author.openId === userInfo.openId) {
        console.log('onUserInfoUpdated updated post', post);
        post.author = userInfo;
      }
    })
    this.setData({ posts: this.data.posts });
  }
}



//这个事件会由帖子详情页触发
function onPostUpdated(post) {
  console.log('post updated', post, this);
  if (!this.data.posts) {
    return;
  }
  const postIndex = this.data.posts.findIndex(p => p.id === post.id);
  if (postIndex >= 0) {
    this.data.posts[postIndex] = post;
    this.setData({ posts: this.data.posts });
  }
}

function onPostDeleted(id) {
  const postIndex = this.data.posts.findIndex(p => p.id === id);
  if (postIndex >= 0) {
    this.data.posts.splice(postIndex, 1);
    this.setData({ posts: this.data.posts });
  }
}

export function listenToPostChanges(that) {
  //帖子页触发
  global.on('postUpdated', onPostUpdated, that);
  global.on('postDeleted', onPostDeleted, that);
  //个人资料编辑时触发（在data.js调接口后触发）
  global.on('userInfoUpdated', onUserInfoUpdated, that);   
}

export function unlistenToPostChanges(that) {
  global.off('postUpdated', onPostUpdated, that);
  global.off('postDeleted', onPostDeleted, that);
  global.off('userInfoUpdated', onUserInfoUpdated, that);   
}



function onCommentUpdated(comment) {
  console.log('comment updated', comment, this);
  if (!this.data.post || !this.data.post.comments) {
    return;
  }
  const index = this.data.post.comments.findIndex(c => c.id === comment.id);
  if (index >= 0) {
    this.data.post.comments[index] = comment;
    this.setData({ post: this.data.post });
  }
}

function onCommentDeleted(id) {
  console.log('comment deleted', id, this);
  if (!this.data.post || !this.data.post.comments) {
    return;
  }
  const index = this.data.post.comments.findIndex(c => c.id === id);
  if (index >= 0) {
    this.data.post.comments.splice(index, 1);
    this.setData({ post: this.data.post });
  }
}

export function listenToCommentChanges(that) {
  global.on('commentUpdated', onCommentUpdated, that);
  global.on('commentDeleted', onCommentDeleted, that);
}

export function unlistenToCommentChanges(that) {
  global.off('commentUpdated', onCommentUpdated, that);
}