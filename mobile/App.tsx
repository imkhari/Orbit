import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, StatusBar, ScrollView } from 'react-native';

export default function App() {
  const [quickTitle, setQuickTitle] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🌌 Orbit</Text>
          <Text style={styles.subtitle}>Điều phối công việc cho tâm trí ADHD</Text>
        </View>
        
        {/* Quick Energy Selector */}
        <View style={styles.energyPill}>
          <Text style={styles.energyLabel}>Năng lượng: {energyLevel === 'LOW' ? '☕ Thấp' : energyLevel === 'MEDIUM' ? '⚡ Vừa' : '🔥 Cao'}</Text>
        </View>
      </View>

      {/* Main Focus Area */}
      <ScrollView style={styles.content}>
        <View style={styles.focusCard}>
          <Text style={styles.cardBadge}>🎯 ĐANG THỰC HIỆN (DOING - WIP: 1/1)</Text>
          <Text style={styles.taskTitle}>Hoàn thành tài liệu PRD & Base Project</Text>
          <Text style={styles.taskSubtext}>Thời lượng ước tính: 25 phút • Độ khẩn cấp: Cao</Text>
          
          <View style={styles.subtaskBox}>
            <Text style={styles.subtaskHeader}>Các bước nhỏ do AI hỗ trợ:</Text>
            <Text style={styles.subtaskItem}>✓ Soạn thảo User Stories chuẩn Gherkin</Text>
            <Text style={styles.subtaskItem}>✓ Thiết lập sơ đồ ERD & API Backend</Text>
            <Text style={styles.subtaskItem}>○ Commit mã nguồn lên Git repository</Text>
          </View>
        </View>
      </ScrollView>

      {/* Quick Capture Bar at Bottom */}
      <View style={styles.captureBar}>
        <TextInput
          style={styles.input}
          placeholder="Thêm nhanh việc mới vào Backlog..."
          placeholderTextColor="#64748B"
          value={quickTitle}
          onChangeText={setQuickTitle}
        />
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
          <Text style={styles.sendButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  energyPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  energyLabel: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  focusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  cardBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  taskSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  subtaskBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
  },
  subtaskHeader: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtaskItem: {
    color: '#E2E8F0',
    fontSize: 13,
    marginVertical: 3,
  },
  captureBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
});
