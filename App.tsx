import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💪 惯犯粉碎机</Text>
      <Text style={styles.subtitle}>你的口袋英语批改员</Text>

      <View style={styles.menuCard}>
        <Text style={styles.menuEmoji}>📝</Text>
        <Text style={styles.menuTitle}>交作业</Text>
        <Text style={styles.menuDesc}>写下英语，AI 帮你揪出错题</Text>
      </View>

      <View style={styles.menuCard}>
        <Text style={styles.menuEmoji}>🔥</Text>
        <Text style={styles.menuTitle}>今日粉碎</Text>
        <Text style={styles.menuDesc}>3 分钟，粉碎你的惯犯错误</Text>
      </View>

      <Text style={styles.footer}>M1 · 2026 · by Zoey</Text>
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
