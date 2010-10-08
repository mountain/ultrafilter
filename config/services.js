exports.services = {
  abbrs: {
    n: 'notifications',
    rc: 'recentchanges',
    s: 'shorturl',
  },
  langs: ['cs', 'en', 'he', 'ml', 'ru', 'ta', 'zh-hans', 'zh-hant'],
  variants: {
    'zh-hans': 'zh',
    'zh-hant': 'zh',
  },
  supported: {
    cs: ['s'],
    en: ['s'],
    he: ['s'],
    ml: ['s'],
    ru: ['s'],
    ta: ['s'],
    zh: ['rc', 'n', 's'],
    'zh-hans': ['rc', 'n', 's'],
    'zh-hant': ['rc', 'n', 's'],
  },
  isSupported: function(lang, service) {
    var result = false;
    for(ind in this.supported[lang]) {
      var s = this.supported[lang][ind];
      if(s === service) {
        result = true;
        break;
      }
    }
    return result;
  },
  batch: {
    zh: {
      fetch: 3000,
      populate: 1000,
      dispatch: 30000,
    },
  },
};
