import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import PracticeScreen from './src/screens/PracticeScreen';
import { getMistakes } from './src/data/store';

export default function App() {
  const [screen, setScreen] = useState('home'); // 现在在哪个房间
  const [mistakeCount, setMistakeCount] = useState(0);

  // 每次回到首页，重新数一遍账本
  useEffect(() => {
    getMistakes().then((m) => setMistakeCount(m.length));
  }, [screen]);

  if (screen === 'practice') {
    return <PracticeScreen onBack={() => setScreen('home')} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Fix It</Text>
      <Text style={styles.subtitle}>你的口袋英语批改员</Text>

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setScreen('practice')}>
        <Text style={styles.menuEmoji}>📝</Text>
        <Text style={styles.menuTitle}>交作业</Text>
        <Text style={styles.menuDesc}>写下英语，AI 帮你揪出错题</Text>
      </TouchableOpacity>

      <View style={styles.menuCard}>
        <Text style={styles.menuEmoji}>🗑</Text>
        <Text style={styles.menuTitle}>错题档案（{mistakeCount}）</Text>
        <Text style={styles.menuDesc}>你的惯犯都在这里，攒够三个毕业</Text>
      </View>

      <Text style={styles.footer}>M2 · 2026 · by Zoey</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6E5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF7B54',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 40,
  },
  menuCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  menuEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
    color: '#888888',
  },
  footer: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 32,
  },
});
