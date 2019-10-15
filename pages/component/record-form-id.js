// pages/component/record-form-id.js
import {
  recordFormId
} from '../../data.js';

Component({
  properties: {
    url: String,
    navigateType: {
      type: String,
      value: 'navigateTo',
    },
  },

  data: {
  },

  methods: {
    onSubmit: function (e) {
      const formId = e.detail.formId;
      // console.log('the target', e, e.target, e.currentTarget);
      recordFormId(formId);

      if (this.properties.url) {
        const navigateFunction = wx[this.properties.navigateType];
        if (!navigateFunction) {
          throw new TypeError('navigateFunction ' + this.properties.navigateType + ' not found!');
        }
        navigateFunction({
          url: this.properties.url,
        })
      }
    }
  }
})
