import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getCheckins, countStreak } from '../data/checkin';

export default function CheckinScreen({ onBack }: { onBack: () => void }) {
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    getCheckins().then(setDays);
  }, []);

  const streak = countStreak(days);
  return (
    <ScrollView style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 回首页</Text>
      </TouchableOpacity>
      <Text style={s.title}>📅 打卡墙</Text>
      <Text style={s.streak}>🔥 连续坚持 {streak} 天</Text>
      <Text style={s.sub}>每天交满3题，当天打卡自动点亮</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF8F0', padding: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#E85D3D' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#E85D3D', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888888' },
  streak:{ fontSize: 26, fontWeight: 'bold', color: '#B8860B', marginBottom: 4 },
});
