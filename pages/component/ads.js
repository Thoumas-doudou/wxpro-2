// pages/component/ads.js
import { jumpToUrl } from '../../utils/util.js';

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    advertisements: { type: Array, value: [], },
  },

  data: {

  },

  methods: {
    gotoAd: function(e) {
      const url = e.currentTarget.dataset.url;
      jumpToUrl(url);
    }
  }
})
