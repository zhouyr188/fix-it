// ============================================================
// SplashScreen —— Fix It 的「开场画面」：App 打门第一眼
// ============================================================
// 剧本：🔧 弹入 → Fix It 标题放大现身 → 标语淡入 → 自动进首页
// 知识点：Animated 三连——spring（弹）/ timing（匀速）/ delay（等轮到它）

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  // 三位演员：logo、标题、标语，各有各的动画值
  const logo = useRef(new Animated.Value(0)).current;    // 0=隐身 1=登场
  const title = useRef(new Animated.Value(0)).current;
  const slogan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 导演开机：三个镜头按顺序来（sequence=排队，delay=等前一个演完）
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 3, useNativeDriver: false }),
      Animated.timing(title, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(slogan, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.delay(900), // 让观众把标语读完
    ]).start(() => onDone()); // 全演完 → 通知 App 换房间到首页

    // 保险丝：万一动画卡死，3.5 秒后强制进首页，不许观众干等
    const fuse = setTimeout(onDone, 3500);
    return () => clearTimeout(fuse);
  }, []);

  return (
    <View style={s.page}>
      <Animated.Text style={[s.logo, { opacity: logo, transform: [{ scale: logo }] }]}>
        🔧
      </Animated.Text>
      <Animated.Text style={[s.title, { opacity: title }]}>Fix It</Animated.Text>
      <Animated.Text style={[s.slogan, { opacity: slogan }]}>
        Fix yourself. Become a brand-new you.
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF6E5', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 72 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#FF7B54', marginTop: 12 },
  slogan: { fontSize: 15, color: '#888888', marginTop: 16, fontStyle: 'italic' },
});
