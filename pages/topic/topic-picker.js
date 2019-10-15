// pages/topic/topic-picker.js
import { getTopics } from '../../data.js';

Page({
  data: {
    topics: [],
    role: 'picker',
  },

  onLoad: function (options) {
    this.setData(options);
    getTopics().then(topics => this.setData({ topics }));
  },
})