// pages/component/home-btn.js
Component({
  properties: {
  },

  data: {
    showHomeBtn: false,
  },

  attached: function() {
    const showHomeBtn = getCurrentPages().length === 1;
    this.setData({ showHomeBtn });
  },

  methods: {
  }
})
