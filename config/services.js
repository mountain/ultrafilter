exports.services = {
  abbrs: {
    n: 'notifications',
    rc: 'recentchanges',
    s: 'shorturl',
  },
  langs: ['cs', 'en', 'he', 'ml', 'ru', 'ta', 'zh', 'zh-cn', 'zh-tw'],
  variants: {
    'zh-cn': 'zh',
    'zh-tw': 'zh',
  },
  supported: {
    cs: ['s'],
    en: ['s'],
    he: ['s'],
    ml: ['s'],
    ru: ['s'],
    ta: ['s'],
    zh: ['rc', 'n', 's'],
    'zh-cn': ['rc', 'n', 's'],
    'zh-tw': ['rc', 'n', 's'],
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
  db: {
    zh: {
      wiki: 'wiki',
      rc: 'rc'
    },
  },
  batch: {
    zh: {
      fetch: 3000,
      populate: 1000,
      dispatch: 30000,
    },
  },
};
