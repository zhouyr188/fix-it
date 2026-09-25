import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getCheckins, countStreak } from '../data/checkin';

export default function CheckinScreen({ onBack }: { onBack: () => void }) {
  const [days, setDays] = useState<string[]>([]);
const now = new Date();
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());

  useEffect(() => {
    getCheckins().then(setDays);
  }, []);

  const streak = countStreak(days);
  const cells = [];//这个月的全部格子：0=垫片，数字=日期
  const firstDay = new Date(viewY, viewM, 1);
  const daysInMonth = new Date(viewY, viewM +1, 0).getDate();
  for(let i = 0;i < firstDay.getDay(); i++)cells.push(0);
  for(let d = 1;d <= daysInMonth; d++)cells.push(d);
  return (
    <ScrollView style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 回首页</Text>
      </TouchableOpacity>
      <Text style={s.title}>📅 打卡墙</Text>
      <Text style={s.streak}>🔥 连续坚持 {streak} 天</Text>
      <Text style={s.sub}>每天交满3题，当天打卡自动点亮</Text>
     <View style={s.weekRow}>
        {['日','一','二','三','四','五','六'].map((w) => (
            <Text key={w} style={s.weekText}>{w}</Text>
        ))}
     </View>
     <View style={s.monthRow}>
        <TouchableOpacity onPress={() => (viewM === 0 ? (setViewM(11), setViewY(viewY - 1)) : setViewM(viewM - 1))}>
          <Text style={s.monthBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.monthTitle}>{viewY}年{viewM + 1}月</Text>
        <TouchableOpacity onPress={() => (viewM === 11 ? (setViewM(0), setViewY(viewY + 1)) : setViewM(viewM + 1))}>
          <Text style={s.monthBtn}>→</Text>
        </TouchableOpacity>
      </View>
     <View style={s.wall}>
        {cells.map((d, i) => {
            const key = viewY + '-' + (viewM + 1) + '-' + d;
            const lit = d > 0 && days.includes(key);
            const today = d === now.getDate() && viewM === now.getMonth() && viewY === now.getFullYear();
            return(
                <View key={i + '-' + d} style={[s.grid, d === 0 && s.gridBlank, lit && s.gridLit, today && s.gridToday]}>
                    <Text style={s.gridText}>{d > 0 ? d : ''}</Text>
                    </View>
            );
        })}
     </View>
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
  wall: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  grid: { width: '13.2%', aspectRatio: 1, backgroundColor: '#E8E4DC', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gridBlank: { backgroundColor: 'transparent' },
  weekRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  weekText: { width: '13.2%', textAlign: 'center', color: '#999999', fontSize: 13 },
  gridLit: { backgroundColor: '#FFD56B' },
  gridToday: { borderWidth: 2, borderColor: '#E85D3D' },
  gridText: { fontSize: 16, color: '#666666' },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: '#E85D3D' },
  monthBtn: { fontSize: 22, color: '#E85D3D', padding: 6 },
});
