// ============================================================
// BackupScreen —— Fix It 的「搬家公司营业厅」：打包 / 拆箱
// ============================================================
// 结构：上半场「打包寄出」（箱子文本 + 复制 / 下载），
//      下半场「拆箱入库」（粘贴箱 + 拆箱按钮 + 入库报告）。
// 网页版和手机版共用这一间：复制/粘贴人人都有；
// 「下载文件」按钮只在网页版露脸（手机上藏起来，不吓人）。

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { buildBackup, restoreBackup } from '../data/backup';

// 网页版才认得 window/document；手机上这个变量就是 false，下载按钮自动藏
const IS_WEB = typeof window !== 'undefined' && typeof document !== 'undefined';

export default function BackupScreen({ onBack }: { onBack: () => void }) {
  const [boxText, setBoxText] = useState(''); // 打包出来的箱子文本
  const [pasteText, setPasteText] = useState(''); // 你粘贴进来准备拆的箱子
  const [report, setReport] = useState(''); // 拆箱战报
  const [err, setErr] = useState(''); // errBox 红字显示器（网页版 Alert 不弹，照老规矩亮字）

  // ---- 打包：两张抽屉装一箱 ----
  async function doExport() {
    setErr(''); setReport('');
    try {
      const t = await buildBackup();
      setBoxText(t);
    } catch (e) {
      setErr('打包失败：' + String(e));
    }
  }

  // ---- 下载：把箱子存成文件（只网页版）----
  function doDownload() {
    if (!boxText) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([boxText], { type: 'application/json' }));
    a.download = 'fixit-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---- 拆箱：门卫验箱 → 合并入库 ----
  async function doImport() {
    setErr(''); setReport('');
    if (!pasteText.trim()) { setErr('先粘贴一箱——空箱子拆不了'); return; }
    try {
      const r = await restoreBackup(pasteText);
      if (!r.ok) { setErr('门卫拦下了：' + r.reason); return; }
      setReport(
        '📦 拆箱完成：新收惯犯 ' + r.addedM + ' 头（跳过重复 ' + r.skippedM + '，拦下脏货 ' + r.dirtyM + '）' +
        '，新收好句 ' + r.addedS + ' 句（跳过重复 ' + r.skippedS + '）'
      );
      setPasteText(''); // 箱子拆完清空，防手滑拆两遍
    } catch (e) {
      setErr('拆箱失败：' + String(e));
    }
  }

  return (
    <ScrollView style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 回首页</Text>
      </TouchableOpacity>
      <Text style={s.title}>📦 搬家公司</Text>
      <Text style={s.sub}>两张抽屉打进一只箱子，换浏览器/换电脑家当不丢</Text>

      {err ? <Text style={s.err}>{err}</Text> : null}

      {/* ---------- 上半场：打包寄出 ---------- */}
      <TouchableOpacity style={s.btn} onPress={doExport}>
        <Text style={s.btnText}>📦 打包我全部家当</Text>
      </TouchableOpacity>

      {boxText ? (
        <View style={s.boxCard}>
          <Text style={s.boxLabel}>📦 箱子长这样（{boxText.length} 字）：</Text>
          <TextInput
            style={s.boxView}
            value={boxText}
            editable={false}
            multiline
          />
          <View style={s.row}>
            <TouchableOpacity style={s.smallBtn} onPress={() => { setBoxText(''); }}>
              <Text style={s.smallBtnText}>收起</Text>
            </TouchableOpacity>
            {IS_WEB ? (
              <TouchableOpacity style={s.smallBtn} onPress={doDownload}>
                <Text style={s.smallBtnText}>⬇️ 下载成文件</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ---------- 下半场：拆箱入库 ---------- */}
      <Text style={s.sectionTitle}>🚚 搬进新家（拆箱入库）</Text>
      <TextInput
        style={s.pasteBox}
        placeholder="把箱子（JSON 文本）整段粘到这里…"
        placeholderTextColor="#BBBBBB"
        value={pasteText}
        onChangeText={setPasteText}
        multiline
      />
      <TouchableOpacity style={s.btn} onPress={doImport}>
        <Text style={s.btnText}>🔧 拆箱入库（只加不删）</Text>
      </TouchableOpacity>

      {report ? <Text style={s.report}>{report}</Text> : null}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF8F0', padding: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#E85D3D' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#E85D3D', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888888', marginBottom: 16 },
  err: { color: '#D32F2F', fontSize: 14, marginBottom: 12, backgroundColor: '#FDECEA', padding: 8, borderRadius: 8 },
  btn: { backgroundColor: '#E85D3D', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  boxCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 16 },
  boxLabel: { fontSize: 13, color: '#888888', marginBottom: 6 },
  boxView: { fontSize: 11, color: '#555555', backgroundColor: '#FFF3E6', borderRadius: 8, padding: 8, height: 140 },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  smallBtn: { backgroundColor: '#FFF3E6', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  smallBtnText: { color: '#E85D3D', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#E85D3D', marginTop: 8, marginBottom: 8 },
  pasteBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 10, height: 120, fontSize: 12, color: '#333333', marginBottom: 10, textAlignVertical: 'top' },
  report: { color: '#2E7D32', fontSize: 14, marginTop: 4, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8 },
});
