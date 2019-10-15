// pages/messages/messages.js
import { getMessages, getLastReadTimestamp, updateLastReadTimestamp, deleteMessage } from '../../data.js';
import { formatFriendlyTime, rightSwipeDebuger } from '../../utils/util.js';

function cookMessages(messages) {
  messages.forEach(m => {
    if (m.type === 'likePost') {
      m.originData = { ...m.post };
      m.content = '赞了你的主题帖';
      m.url = "../post/post?id=" + m.originData.id;
      if (m.originData.deleted) {
        m.originData.deletedMessage = '原贴已删除';
      }
    } else if (m.type === 'likeComment') {
      m.originData = { ...m.comment };
      m.content = '赞了你的评论';
      m.url = "../commentdetail/detail?commentId=" + m.originData.id;
      if (m.originData.deleted) {
        m.originData.deletedMessage = '原评论已删除';
      }
    } else if (m.type === 'likeReply') {
      m.originData = { ...m.reply };
      m.content = '赞了你的回复';
      if (m.originData.deleted) {
        m.originData.deletedMessage = '原回复已删除';
      }
    } else if (m.type === 'reply') {
      m.originData = { ...m.comment };
      m.content = m.reply.content;
      m.images = m.reply.images;
      m.url = "../commentdetail/detail?commentId=" + m.originData.id;
      if (m.originData.deleted) {
        m.originData.deletedMessage = '原评论已删除';
      }
    } else if (m.type === 'comment') {
      m.originData = { ...m.post };
      m.content = m.comment.content;
      m.images = m.comment.images;
      m.url = "../post/post?id=" + m.originData.id;
      if (m.originData.deleted) {
        m.originData.deletedMessage = '原贴已删除';
      }
    }

    if (m.originData && m.originData.deleted) {
      m.url = '';
    }
    m.dateTimeString = formatFriendlyTime(m.timestamp);
  })
  return messages;
}

Page({
  data: {
    messages: [],
    lastReadTimestamp: new Date().getTime(),
    bottomLoading: false,
  },

  ...rightSwipeDebuger,

  onShow: function () {
    wx.removeTabBarBadge({ index: 1, });

    //获取上次读取时间
    getLastReadTimestamp().then(lastReadTimestamp => {
      this.setData({ lastReadTimestamp });
      updateLastReadTimestamp();
    });

    //获取消息列表
    getMessages().then(messages => {
      cookMessages(messages);
      this.setData({ messages })
    });
  },
  onPreview: function(e) {
    const images = e.currentTarget.dataset.images;
    wx.previewImage({
      urls: images,
    })
  },
  onReachBottom: function () {
    if (this.getMessagesPromise) {
      return;
    }
    let lastTimestamp = undefined;
    if (this.data.messages.length > 0) {
      lastTimestamp = this.data.messages.slice(-1)[0].timestamp;
    }
    //获取消息列表
    this.setData({ bottomLoading: true })
    this.getMessagesPromise = getMessages(lastTimestamp, { silent: true }).then(messages => {
      this.setData({ bottomLoading: false })
      cookMessages(messages);
      this.setData({ messages: this.data.messages.concat(messages) });
    })
    .then(() => delete this.getMessagesPromise)
    .catch(() => delete this.getMessagesPromise)
  },
  gotoContent: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },
  onEmptyFunction: function() {},
  onLongPress: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      content: '确认删除?',
      success: (res) => {
        if (res.confirm) {
          deleteMessage(id).then(() => {
            const messageIndex = this.data.messages.findIndex(m => m.id === id);
            if (messageIndex >= 0) {
              this.data.messages.splice(messageIndex, 1);
              this.setData({ messages: this.data.messages });
            }
          });
        }
      }
    })
  }
})