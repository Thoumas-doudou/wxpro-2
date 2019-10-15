// pages/component/input-limit.js
import { countLetter } from '../../utils/util.js';

Component({
  properties: {
    content: {
      type: String,
      value: '',
      observer: function(newValue) {
        const currentLength = countLetter(newValue);
        this.setData({ currentLength });
      }
    },
    maxInputLength: {
      type: Number,
      value: 20,
    },
    displayWhenRemainingLessThan: {
      type: Number,
      value: Number.MAX_SAFE_INTEGER,
    }
  },

  data: {
    currentLength: 0,
  },

  methods: {
  }
})
