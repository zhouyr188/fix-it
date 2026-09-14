// ============================================================
// SentencesScreen —— Fix It 的「好句墙」：你的私人好句本
// ============================================================
// 句子从哪来：交作业被 AI 升级的好句子，你按「收藏好句」收进来
// 用途：睡前翻一翻、考前背一背（周二任务「睡前看好句库 10min」就是这页）
// 结构：师傅搭好的空房间 + 卡片列表（和基因库一个手艺：map 冲印）

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getSentences } from '../data/sentences';

export default function SentencesScreen({ onBack }: { onBack: () => void }) {
  const [sentences, setSentences] = useState<any[]>([]); // 从好句抽屉搬出来的全部句子

  // 进屋先开抽屉
  useEffect(() => {
    getSentences().then(setSentences);
  }, []);

  return (
    <ScrollView style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 回首页</Text>
      </TouchableOpacity>
      <Text style={s.title}>🌟 好句墙</Text>
      <Text style={s.sub}>被你亲手升级过的好句子 · 共 {sentences.length} 句</Text>

      {sentences.length === 0 ? (
        <Text style={s.empty}>
          墙还空着——去「交作业」写一句，批改完按「收藏好句」，好句子就会挂上这面墙
        </Text>
      ) : (
        sentences.map((x, i) => (
          <View style={s.card} key={x.en}>
            <Text style={s.date}>📅 {x.date} · {x.trapType}病治愈</Text>
            <Text style={s.en}>{x.en}</Text>
            {x.note ? <Text style={s.note}>💡 {x.note}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF8F0', padding:  20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#E85D3D' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#E85D3D', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888888', marginBottom: 16 },
  empty: { fontSize: 15, color: '#999999', textAlign: 'center', marginTop: 60, lineHeight: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 10 },
  date: { fontSize: 12, color: '#BBBBBB', marginBottom: 6 },
  en: { fontSize: 16, color: '#333', lineHeight: 26 },
  note: { fontSize: 13, color: '#6A4C93', marginTop: 8, lineHeight: 20 },
});
