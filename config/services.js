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
  }
};
