//const BASE_URL = 'https://www.matrixsci.cn/bycircle/';
//const OSS_BASE_URL = 'https://matrixsci.oss-cn-beijing.aliyuncs.com';
//const IMAGE_BASE_URL = 'http://oss.matrixsci.cn/bycircle/';
//const IMAGE_BUCKET = 'bycircle';
const BASE_URL = 'https://moments.weiwangge.com/moments/';
const OSS_BASE_URL = 'https://oss.weiwangge.com';
const IMAGE_BASE_URL = 'https://oss.weiwangge.com/bycircle/';
const IMAGE_BUCKET = 'bycircle';

//在这里设置值：https://moments.weiwangge.com/moments/swagger/index.html#!/version/add
// key: sendContentEnabled_x.x.x
// value: true / false
const CURRENT_VERSION = '1.0.20';

//============ 基础http封装 =============
function validate200(res, options) {
  if (res.statusCode != '200') {
    console.error(res);
    !options.silent && wx.showToast({ title: `网络错误：${res.statusInfo || res.message}`, icon: 'none' })
    throw 'invalid statusCode ' + res.statusCode;
  }
  // console.log('validate200 OK');
  return res;
}

const requestPromiseMap = {};

export function request(path, data, method, options = {}) {
  const requestPromiseKey = method + ':' + path;
  let requestPromise = requestPromiseMap[requestPromiseKey];
  if (requestPromiseMap[requestPromiseKey]) {
    return requestPromise;
  }

  const header = ['POST', 'PUT'].indexOf(method) >= 0 ? {
    'Content-Type': 'application/json',
  } : {};
  console.debug('HTTP request', path, data, method, options);
  !options.silent && wx.showLoading({});
  requestPromise = new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      data: data,
      method,
      header,
      success: resolve,
      fail: reject,
    })
  }).then(res => {
    !options.silent && wx.hideLoading();
    return res;
  }).then(res => {
    console.debug('HTTP response for', path, data, method, options, res);
    return res;
  })
  .then(res => validate200(res, options))
  .then(res => res.data)
  // .then(res => res.data || res)
  // .then(data => validate200(data, options));

  function removeRequestPromise(res) {
    delete requestPromiseMap[requestPromiseKey];
    return res;
  }
  requestPromiseMap[requestPromiseKey] = requestPromise.then(removeRequestPromise).catch(removeRequestPromise);
  return requestPromise;
}

export function _get(path, data, options) {
  return request(path, data, 'GET', options);
}

export function _post(path, data, options) {
  return request(path, data, 'POST', options);
}

export function _delete(path, data, options) {
  return request(path, data, 'DELETE', options);
}
//============ 基础http封装 end =============

//获取 openId。如果有缓存就返回缓存值
//否则调用微信API获取jscode并调用后台API获取openId
export function getOpenId(options = { validateLogin: true }) {
  // return Promise.resolve('test');
  return getOpenIdWithoutLoginCheck().then(_validateLogin);
}

let loginPromise = null;
export function getOpenIdWithoutLoginCheck() {
  // return Promise.resolve('test');
  const openId = wx.getStorageSync('openId');
  if (openId) { return Promise.resolve(openId); }

  return new Promise((resolve, reject) => {
    wx.login({ success: resolve });
  }).then(res => {
    console.log('login res', res);
    loginPromise = loginPromise || _get('user/login', { jsCode: res.code });
    return loginPromise;
  }).then(res => {
    console.log('login res 1 ', res);
    wx.setStorage({ key: 'openId', data: res.data.openId, });
    if (loginPromise) {
      loginPromise = null;
    }
    return res.data.openId;
  });
}

//判断是否授权微信，判断方式为，如果我们的后台存了用户信息则判定为已授权。
//如果未授权则调到登录页面。
function _validateLogin(openId) {
  return getUserInfo().then(() => openId)//.catch(() => openId);
}

//从自己的后台获取用户信息
let getOpenIdWithoutLoginCheckPromise = null;
let isRedirectingToLoginPage = false;
export function getUserInfo(options = {}) {
  const userInfoRes = wx.getStorageSync('userInfoRes');
  console.log('getUserInfo', options, userInfoRes);
  if (!options.noCache && userInfoRes) {
    return Promise.resolve(userInfoRes);
  }
  getOpenIdWithoutLoginCheckPromise = getOpenIdWithoutLoginCheckPromise || getOpenIdWithoutLoginCheck().then(openId => {
    // return {};
    return _get('user/info', { openId }, { silent: true });
  }, { silent: false }).then(res => {
    if (!res.data || !res.data.nickName) {
      if (!isRedirectingToLoginPage) {
        console.warn('hahahah');
        setTimeout(() => {
          global.sharedUrl = global.originSharedUrl;
          wx.reLaunch({ url: '/pages/login/login', })
          isRedirectingToLoginPage = true;
        }, 500)
        throw "[Warning] not logged in. redirecting to login page";
      }
      throw "[Warning] not logged in. wait for redirecting to login page"
      return {};
    }
    wx.setStorage({ key: 'userInfoRes', data: res, });
    return res;
  }).then(res => {
    getOpenIdWithoutLoginCheckPromise = null;
    return res;
  }).catch(e => {
    getOpenIdWithoutLoginCheckPromise = null;
    throw e;
  })
  return getOpenIdWithoutLoginCheckPromise;
}

export function toParamString(obj) {
  return Object.keys(obj || {})
    .reduce((res, key) => res.concat([key + '=' + encodeURI(obj[key])]), [])
    .join('&');
}

//用微信的信息来更新用户信息
export function updateUserInfoWithWxData(params) {
  const userInfoRes = wx.getStorageSync('userInfoRes') || { };
  userInfoRes.data = {
    nickName: params.nickName,
    avatarUrl: params.avatarUrl,
    sign: null,
    isUserSetNickName: false,
    isUserSetAvatar: false,
  }
  
  return getOpenIdWithoutLoginCheck().then(openId => {
    userInfoRes.data.openId = openId;
    return _post('user/update', userInfoRes.data, { silent: false });
  }).then(res => {
    wx.setStorage({ key: 'userInfoRes', data: userInfoRes, });
    return res;
  })
}

export function updateUserInfo(userInfoInput) {
  console.log('updateUserInfo input:', userInfoInput);
  return Promise.all([getOpenId(), getUserInfo()]).then(([openId, userInfoRes]) => {
    const userInfo = {
      ...userInfoRes.data,
      ...userInfoInput,
    };
    return _post('user/update', userInfo);
  }).then(res => {
    console.log('updateUserInfo res:', res);
    if (res.code != 200) {
      throw res.message;
    }
    wx.setStorage({ key: 'userInfoRes', data: res, });
    global.trigger('userInfoUpdated', res.data);
    return res;
  })
}

export function getHotTopics() {
  return _get('topic/hotTopics', null, { silent: true }).then(({data}) => data);
}

export function getTopics() {
  return _get('topic/getAll').then(({data}) => data);
}

//获取一个帖子
export function getPost(id, options={}) {
  return getOpenId().then(openId => {
    return _get('post/get', { id, openId }, options).then(({ data }) => data);
  })
}

//进页面时的第一次拉取，获取已经推荐过的最新的N条帖子
//如果没有，就调用下拉刷新的推荐
export function getFirstRecommend() {
  return getOpenId().then(openId => {
    return _get('post/recommendNow', { openId }).then(data => {
      if (data.data.length === 0) {
        return getRecommend(openId).then(_adapTopicModel);
      }
      return data;
    });
  }).then(_adapTopicModel);
}
//上拉刷新时用
export function getRecommend() {
  return getOpenId().then(openId => {
    return _get('post/recommend', { openId });
  }).then(_adapTopicModel);
}
function _adapTopicModel(data) {
  return {
    ...data,
    data: data.data.map(post => ({
      ...post,
      topic: post.topicModel || post.topic,
    }))
  };
}
//推荐列表历史记录
export function getRecommendHistory(lastRecommendId, options) {
  return getOpenId().then(openId => {
    return _get('post/recommendHistory', {openId, lastRecommendId}, options || {});
  })
}

//获取一个主题的信息
export function getTopic(id, type) {
  return getOpenId().then(openId => {
    return _get('topic/get', {id, openId, type}).then(data => data.data);
  })
}

//发帖
export function addPost({content, images, topicId, wxId, specifiedOpenId}) {
  console.log('发帖 inputs', content, images, topicId, wxId);

  const hasImage = images.length > 0;
  const api = hasImage ? 'post/addNew' : 'post/add';

  return getOpenId().then(openId => {
    wx.showLoading({ title: '进行中...', })
    openId = specifiedOpenId || openId;
    return _post(api, {
      openId, content, topicId,
      images: images.map(image => _getFilePostfix(image)),
      wxId
    });
  }).then(post => {
    console.log('post result', post);
    if (images.length === 0) {
      return [post];
    }
    const id = post.data.id;
    wx.showLoading({ title: `上传图片(0/${images.length})`, mask: true })
    return Promise.all([
      Promise.resolve(post),
      ...images.map((image, index) => {
        return uploadPostImage(id, index, image).then(() => {
          wx.showLoading({ title: `上传图片(${index+1}/${images.length})`, mask: true })
        });
      })
    ]);
  }).then(([post, ...rest]) => {
    const id = post.data.id;
    console.log('the post', post);
    if (hasImage) {
      return activatePost(id).then(() => {
        wx.hideLoading();
        return post;
      });
    } else {
      wx.hideLoading();
      return post;
    }
  }).catch(err => {
    wx.hideLoading();
    throw err;
  })
}

//在传完图片之后激活帖子
export function activatePost(postId) {
  return _post('post/active?id='+postId, null, { silent: true });
}

//发评论
export function addComment({content, images, postId, formId}) {
  console.log('发评论', content, images, postId);
  return getOpenId().then(openId => {
    return _post('comment/add', {
      openId, content, postId, formId,
      images: images.map(image => _getFilePostfix(image))
    }, { silent: true })
  }).then(comment => {
    if (images.length === 0) {
      console.log('comment result', comment);
      return [comment];
    }
    const id = comment.data.id;
    // wx.showLoading({ title: `上传图片(0/${images.length})` })
    return Promise.all([
      Promise.resolve(comment),
      ...images.map((image, index) => {
        return uploadCommentImage(id, index, image).then(() => {
          // wx.showLoading({ title: `上传图片(${index + 1}/${images.length})` })
        });
      })
    ]);
  }).then(([comment, ...rest]) => {
    // wx.hideLoading();
    return comment;
  }).catch(err => {
    // wx.hideLoading();
    throw err;
  })
}

//发回复
export function addReply({ content, images, commentId, replyTo, formId }) {
  console.log('发回复', content, images, commentId);
  return getOpenId().then(openId => {
    return _post('reply/add', {
      openId, content, commentId, replyTo, formId,
      images: images.map(image => _getFilePostfix(image))
    }, { silent: true })
  }).then(reply => {
    if (images.length === 0) {
      console.log('reply result', reply);
      return [reply];
    }
    const id = reply.data.id;
    // wx.showLoading({ title: `上传图片(0/${images.length})` })
    return Promise.all([
      Promise.resolve(reply),
      ...images.map((image, index) => {
        return uploadReplyImage(id, index, image).then(() => {
          // wx.showLoading({ title: `上传图片(${index + 1}/${images.length})` })
        });
      })
    ]);
  }).then(([reply, ...rest]) => {
    // wx.hideLoading();
    return reply;
  }).catch(err => {
    // wx.hideLoading();
    throw err;
  })
}

function _getFilePostfix(filePath) {
  return filePath.split('.').slice(-1)[0];
}

export function uploadPostImage(postId, index, filePath) {
  const postfix = _getFilePostfix(filePath);
  const fileName = `${index}.${postfix}`;
  return uploadOneFile({ index, filePath, key: `${IMAGE_BUCKET}/post/${postId}/${fileName}`, });
}

export function uploadCommentImage(commentId, index, filePath) {
  const postfix = _getFilePostfix(filePath);
  const fileName = `${index}.${postfix}`;
  return uploadOneFile({ index, filePath, key: `${IMAGE_BUCKET}/comment/${commentId}/${fileName}`, });
}

export function uploadReplyImage(replyId, index, filePath) {
  const postfix = _getFilePostfix(filePath);
  const fileName = `${index}.${postfix}`;
  return uploadOneFile({ index, filePath, key: `${IMAGE_BUCKET}/reply/${replyId}/${fileName}`, });
}

export function uploadAvatar(filePath) {
  const postfix = _getFilePostfix(filePath);
  return getOpenId().then(openId => {
    const fileName = `${openId}.${postfix}`;
    return Promise.all([
      Promise.resolve(fileName), 
      uploadOneFile({ openId, filePath, key: `${IMAGE_BUCKET}/avatar/${fileName}` })
    ]);
  }).then(([fileName]) => {
    const timestamp = new Date().getTime();
    return `${IMAGE_BASE_URL}avatar/${fileName}?t=${timestamp}`;
  })
}

export function uploadOneFile({index, filePath, key}) {
  return new Promise((resolve, reject) => {
    const postfix = _getFilePostfix(filePath);
    const fileName = `${index}.${postfix}`;
    console.log('upload file', index, filePath, key);
    // console.log(`https://matrixsci.oss-cn-beijing.aliyuncs.com/${IMAGE_BUCKET}/post/${postId}/${fileName}`);
    wx.uploadFile({
      url: OSS_BASE_URL,
      filePath: filePath,
      name: 'file',
      formData: {
        name: fileName,
        key: key,
        policy: 'eyJleHBpcmF0aW9uIjoiMjAyMC0wMS0wMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W1siY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsMTA0ODU3NjAwMF1dfQ==',
        OSSAccessKeyId: 'LTAINcOTUV2N5lg3',
        signature: 'wttEoFs7yIl5o+tOb9OZr6B56v8=',
      },
      success: res => {
        console.log('upload success', res);
        resolve();
      },
      fail: res => {
        console.error('upload fail', res);
        reject();
      },
    })
  })
}

export function like(type, id) {
  return getOpenId().then(openId => {
    //wx.showLoading({ title: '点赞中...', })
    return _post('common/like', {id, openId, type}, { silent: true })
  });
}

export function dislike(type, id) {
  return getOpenId().then(openId => {
    //wx.showLoading({ title: '点赞中...', })
    return _post('common/dislike', { id, openId, type }, { silent: true })
  });
}

export function share(type, id) {
  return getOpenId().then(openId => {
    //wx.showLoading({ title: '点赞中...', })
    return _post('common/share', { id, openId, type }, { silent: true })
  });
}

export function unshare(type, id) {
  return getOpenId().then(openId => {
    //wx.showLoading({ title: '点赞中...', })
    return _post('common/unshare', { id, openId, type }, { silent: true })
  });
}

export function deletePost(id) {
  return _get("post/delete", {id}, { silent: true });
}

export function deleteComment(id) {
  return _get("comment/delete", { id }, { silent: true });
}

export function deleteReply(id) {
  return _get("reply/delete", { id }, { silent: true });
}
// comment and reply API
export function getComment(id, options) {
  return getOpenId().then(openId => {
    return _get("/comment/get", { openId, id }, options).then(({ data }) => data);
  });
}

// 获取消息
export function getMessages(lastReadTimestamp = new Date().getTime(), options) {
  // const lastReadTimestamp = wx.getStorageSync('lastReadTimestamp') || 0;
  return getOpenId().then(openId => {
    return _get('user/messages', { openId, lastReadTimestamp }, options || {});
  }).then(res => {
    console.log('getMessages res', res);
    return res.data;
  })
}


//个人主页：通过openId获取用户信息
export function getUserInfoByOpenId(openId) {
  return _get('user/info', { openId }, { silent: true });
}

//获取上次读取消息的时间戳
export function getLastReadTimestamp() {
  return getOpenId().then(openId => {
    return _get('user/message/timestamp/get', { openId }, { silent: true }).then(res => res.timestamp);
  })
}

//更新读取消息的时间戳
export function updateLastReadTimestamp() {
  return getOpenId().then(openId => {
    return _get('user/message/timestamp/update', { openId }, { silent: true });
  })
}

//获取未读消息数量
export function getUnreadMessageCount() {
  return getOpenIdWithoutLoginCheck().then(openId => {
    return _get('user/message/number', { openId }, { silent: true }).then(res => res.number);
  })
}

//删除消息
export function deleteMessage(id) {
  return _get("user/message/delete", { id }, { silent: true });
}

//个人主页：通过openId获取用户发表的帖子
export function getPostByUser(openId, timestamp) {
  return _get('post/getByUser', { openId, timestamp });
}

//举报帖子
export function reportPost(id) {
  return getOpenId().then(openId => {
    return _get("post/report", { id, openId }, { silent: true });
  })
}

//举报评论
export function reportComment(id) {
  return getOpenId().then(openId => {
    return _get("comment/report", { id, openId }, { silent: true });
  })
}

//举报回复
export function reportReply(id) {
  return getOpenId().then(openId => {
    return _get("reply/report", { id, openId }, { silent: true });
  })
}

export function getMorePostsByStore(topicId, score) {
  return getOpenId().then(openId => {
    return _get("post/getByTopicId", { topicId, openId, score})
  })
}

export function getMorePostsByTime(topicId, timestamp) {
  return getOpenId().then(openId => {
    return _get("post/getByTopicIdAndTime", { topicId, openId, timestamp })
  })
}

export function getMoreReply(commentId, timestamp, options) {
  timestamp = timestamp || new Date().getTime();
  return getOpenId().then(openId => {
    return _get("reply/getMore", { commentId, openId, timestamp }, options || {})
  })
}

export function getMoreComments(postId, timestamp, options) {
  timestamp = timestamp || new Date().getTime();
  return getOpenId().then(openId => {
    return _get("comment/getMore", { postId, openId, timestamp }, options || {})
  })
}

let getSendContentEnabledPromise = null;
export function getSendContentEnabled() {
  getSendContentEnabledPromise = getSendContentEnabledPromise || 
    getConstant('sendContentEnabled_' + CURRENT_VERSION).then(res => {
      return !!res.value && res.value === 'true';
    });
  return getSendContentEnabledPromise;
}

export function getConstant(key) {
  return _get("version/query", { key });
}

export function getQrcodeImageUrl(path) {
  return 'https://www.matrixsci.cn/bycirle/qrcode?path=' + path;
}

export function getPostQrcodeImageUrl(postId) {
  return 'https://www.matrixsci.cn/pic/'+postId;
}

export function getPostIds(lastScore) {
  if (typeof lastScore === 'number') {
    return _get('post/postListMore', { score: lastScore }, { silent: true }).then(res => res.postIds);
  } else {
    return _get('post/postList', {}, { silent: true }).then(res => res.postIds);
  }
}

export function getPostsByIds(postIds) {
  return getOpenId().then(openId => {
    return _post('post/getByPostIds', { openId, postIds }, { silent: true }).then(res => res.data);
  })
}

export function recordFormId(formId) {
  if (formId.indexOf('mock one') >= 0) {
    console.log('do not record mock form id');
    return Promise.resolve(null);
  }
  console.log('recording formId', formId);
  return getOpenId().then(openId => {
      return _get('formId/add', { openId, formId });
  });
}