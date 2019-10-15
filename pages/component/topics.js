// pages/component/topics.js

function filterTopics(word, topics) {
  return word === '' ? topics : topics.filter(
    topic => topic.name.toLowerCase().indexOf(word.toLowerCase()) >= 0);
}

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    topics: {
      type: Object,
      observer: function(topics, oldTopics) {
        if (JSON.stringify(topics) === JSON.stringify(oldTopics)) {
          console.log('topics unchanged', topics);
          return;
        }
        const topicsToDisplay = filterTopics(this.data.word, this.properties.topics);
        console.log('topics changed', topics, topicsToDisplay);
        this.setData({ topicsToDisplay });
      }
    },
    /**
     * 组件类型，可取值viewer | picker。默认值为viewer
     * viewer - 仅展示主题列表。点击主题可以进入主题页面。
     * picker - 作为主题选择器。点击主题会跳回上一个页面。
     *  选中的主题信息可通过getApp().globalData.selectedTopic获取。
     *  具体值格式为topic的结构。主要格式：{id, name}
     */
    role: { type: String, value: 'viewer' }, // 可取值 view | picker，默认为viewer

    fullHeight: Boolean,
  },

  data: {
    role: 'viewer',
    word: '',
  },

  attached: function() {
    console.log('topics properties', this.properties);
    const topicsToDisplay = this.properties.topics;
    this.setData({ topicsToDisplay });
  },

  methods: {
    onSearch: function(e) {
      const word = e.detail.value;
      console.log('search topic word', word);
      const topicsToDisplay = filterTopics(word, this.properties.topics);
      this.setData({ topicsToDisplay });
    },
    onTopicClick: function(e) {
      const { index } = e.currentTarget.dataset;
      const topic = this.data.topicsToDisplay[index];
      if (this.properties.role === 'picker') {
        getApp().globalData.selectedTopic = topic;
        wx.navigateBack({});
        console.log('topic picker selected', JSON.stringify(topic));
      } else {
        wx.navigateTo({
          url: '/pages/topic/topic?id=' + topic.id,
        })
      }
    }
  }
})
