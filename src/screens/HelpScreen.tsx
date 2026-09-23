// ============================================================
// HelpScreen —— Fix It 的「怎么玩」：一页说明书
// ============================================================
// 文案：Zoey 亲笔（2026-09-23），师傅只搬字不改字
// 为什么不做分步引导？App 够简单，四个房间各一句话就能讲清——
// 需要时来查（字典），不需要时绝不拦路（没有保安）。

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function HelpScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={s.page}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← 回首页</Text>
      </TouchableOpacity>

      <Text style={s.title}>🔧 Fix It — 你的口袋英语批改员</Text>
      <Text style={s.intro}>用于空闲时间锻炼翻译{'\n'}由 AI 出题并批改，错题类型自动归类入库、逐个消灭，具有收藏好句、数据搬运等功能</Text>

      <Text style={s.section}>使用 Tips</Text>

      <Text style={s.block}>
        【交作业】负责进行翻译练习。出新题后左上角会标注难度（范围为四级至雅思水平），将答案填于框中，检查完即可提交。AI 老师将会对你的答案进行批改并评分，并基于你的回答来进行改对和升级，同时指出你的惯犯类型，并将你的错误类型整理储存在【错题档案】内。同时每天坚持完成三句，当日打卡将自动点亮。
      </Text>

      <Text style={s.block}>
        【错题档案】内关押着你的惯犯类型。若要挑战自己的错题，则可点击挑战，输入答案后向怪兽挥刀——怪兽消失的同时，你的错题类型也将随之消失。
      </Text>

      <Text style={s.block}>
        【好句墙】若觉得 AI 老师出的题不错，可以在批改完后点击「🌟收藏好句」，好句就会被存放在【好句墙】内。若觉得好句已经烂熟于心了，则可点击下方🗑️撤下好句。
      </Text>

      <Text style={s.block}>
        【搬家公司】如果切换设备了，我们的数据怎么办呢？搬家公司会为你解决。点击「打包我的全部家当」后下载成文件，完成后将文件内的内容贴在「搬进新家」中，便可以同步原来的数据了。
      </Text>

      <View style={s.quoteCard}>
        <Text style={s.quote}>英语学习重在积累，在精不在多，写作最能够展现学习者们的水平。</Text>
        <Text style={s.quoteEn}>"Details make the difference"</Text>
        <Text style={s.quote}>纠正并解决写作中的小问题，大过反复接收新的知识。所以——</Text>
        <Text style={s.slogan}>Fix yourself. Become a brand-new you.</Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF8F0', padding: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#E85D3D' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#E85D3D', marginBottom: 8 },
  intro: { fontSize: 14, color: '#666666', lineHeight: 22, marginBottom: 16 },
  section: { fontSize: 16, fontWeight: 'bold', color: '#E85D3D', marginBottom: 10 },
  block: { fontSize: 14, color: '#444444', lineHeight: 24, backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 10 },
  quoteCard: { backgroundColor: '#FFF3E6', borderRadius: 12, padding: 16, marginTop: 8, alignItems: 'center' },
  quote: { fontSize: 14, color: '#8a6d3b', lineHeight: 24, textAlign: 'center' },
  quoteEn: { fontSize: 14, color: '#8a6d3b', fontStyle: 'italic', marginVertical: 6 },
  slogan: { fontSize: 17, fontWeight: 'bold', color: '#E85D3D', marginTop: 8 },
});
