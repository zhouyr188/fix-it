// ============================================================
// app.config.js —— 把 .env 里的钥匙悄悄塞给 App（不进 git）
// ============================================================
// 为什么需要它？
//   App 里的代码读不到 .env（那是给电脑上的脚本用的），
//   这里的任务是把钥匙转交给 App：构建时读 .env → 塞进 extra。
//   .env 被 .gitignore 拦着，所以钥匙永远只在你本机。

const zhipuKey = process.env.ZHIPU_API_KEY || '';

export default {
  expo: {
    name: 'Fix It',
    slug: 'gfj',
    version: '1.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: { supportsTablet: true },
    android: { package: 'com.zoey188.gfj' },
    web: { favicon: './assets/favicon.png' },
    extra: {
      eas: { projectId: '8a8394a1-07f3-44e1-b507-a390c22369d7' },
      zhipuKey: zhipuKey,
    },
    owner: 'zoey188s-team',
  },
};
