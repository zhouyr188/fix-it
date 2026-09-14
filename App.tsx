import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import PracticeScreen from './src/screens/PracticeScreen';
import MistakeGalleryScreen from './src/screens/MistakeGalleryScreen';
import BattleScreen from './src/screens/BattleScreen';
import SplashScreen from './src/screens/SplashScreen';
import SentencesScreen from './src/screens/SentencesScreen';
import { getMistakes } from './src/data/store';
import { countSentences } from './src/data/sentences';

export default function App() {
  const [screen, setScreen] = useState('home'); // 现在在哪个房间
  const [booted, setBooted] = useState(false);  // 开场动画演完了吗
  const [mistakeCount, setMistakeCount] = useState(0); // 抽屉里的惯犯人数
  const [sentenceCount, setSentenceCount] = useState(0); // 好句墙上的句子数
  const [battleTarget, setBattleTarget] = useState(null); // 要挑战的怪兽档案（带着它进战斗房）

  // 每次回到首页，重新数一遍账本
  useEffect(() => {
    getMistakes().then((m) => setMistakeCount(m.length));
    countSentences().then(setSentenceCount);
  }, [screen]);

  if (!booted) {
    return <SplashScreen onDone={() => setBooted(true)} />;
  }

  if (screen === 'practice') {
    return <PracticeScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'gallery') {
    return (
      <MistakeGalleryScreen
        onBack={() => setScreen('home')}
        onBattle={(m) => { setBattleTarget(m); setScreen('battle'); }}
      />
    );
  }
  if (screen === 'sentences') {
    return <SentencesScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'battle') {
    return (
      <BattleScreen
        monster={battleTarget}
        onBack={() => setScreen('gallery')}
      />
    );
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

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setScreen('gallery')}>
        <Text style={styles.menuEmoji}>🧬</Text>
        <Text style={styles.menuTitle}>错题档案（{mistakeCount}）</Text>
        <Text style={styles.menuDesc}>惯犯照片墙：按类型关押，连对三次毕业</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setScreen('sentences')}>
        <Text style={styles.menuEmoji}>🌟</Text>
        <Text style={styles.menuTitle}>好句墙（{sentenceCount}）</Text>
        <Text style={styles.menuDesc}>被你亲手升级过的好句子，睡前翻一翻</Text>
      </TouchableOpacity>

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
