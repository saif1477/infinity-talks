import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Expert } from '../data/experts';
import { Colors, Spacing, Typography } from '../constants/theme';

interface Props {
  expert: Expert;
}

export default function ExpertHeader({ expert }: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[expert.gradient[0] + '15', 'transparent']}
        style={styles.gradientBg}
      />
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={expert.gradient} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Image source={expert.avatar} style={styles.avatarImg} resizeMode="cover" />
            </View>
          </LinearGradient>
          {/* Online indicator */}
          <View style={[styles.onlineDot, { backgroundColor: expert.color }]} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{expert.name}</Text>
          <Text style={[styles.title, { color: expert.color }]}>{expert.title}</Text>
        </View>
      </View>
      {/* Accent bar */}
      <LinearGradient
        colors={expert.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  gradientBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  content: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.huge,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glass, alignItems: 'center',
    justifyContent: 'center', marginRight: Spacing.md,
  },
  avatarWrap: { marginRight: Spacing.md },
  avatarRing: {
    width: 44, height: 44, borderRadius: 22, padding: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 20,
    overflow: 'hidden', backgroundColor: Colors.backgroundSecondary,
  },
  avatarImg: { width: '100%', height: '100%' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.background,
  },
  info: { flex: 1 },
  name: { ...Typography.h3, color: Colors.textPrimary },
  title: { ...Typography.caption },
  accentBar: { height: 2, width: '100%' },
});
