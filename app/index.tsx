import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Dimensions, Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ExpertCard from '../components/ExpertCard';
import ModelManagerSheet from '../components/ModelManagerSheet';
import experts, { Expert } from '../data/experts';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const { session, loading } = useAuth();
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth');
    }
  }, [session, loading]);

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(titleAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleExpertPress = (expert: Expert) => {
    router.push(`/chat/${expert.id}`);
  };

  if (loading || !session) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#7C3AED20', '#3B82F610', 'transparent']}
            style={styles.headerGlow}
          />
          <Animated.View style={[styles.logoRow, {
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({
              inputRange: [0, 1], outputRange: [-20, 0],
            }) }],
          }]}>
            <View style={styles.logoIcon}>
              <Ionicons name="chatbubbles" size={24} color={Colors.accentPurple} />
            </View>
            <Text style={styles.logoText}>Infinity Talks</Text>
          </Animated.View>

          <Animated.Text style={[styles.tagline, {
            opacity: subtitleAnim,
            transform: [{ translateY: subtitleAnim.interpolate({
              inputRange: [0, 1], outputRange: [10, 0],
            }) }],
          }]}>
            Chat with history's greatest minds
          </Animated.Text>
          
          <Pressable style={styles.signOutButton} onPress={() => router.push('/profile')}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
          </Pressable>

          {/* Stats bar */}
          <Animated.View style={[styles.statsBar, { opacity: subtitleAnim }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{experts.length}</Text>
              <Text style={styles.statLabel}>Experts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>∞</Text>
              <Text style={styles.statLabel}>Conversations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Local AI</Text>
            </View>
          </Animated.View>

          <ModelManagerSheet />

        </View>

        {/* Section label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose your expert</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Expert Grid */}
        <View style={styles.grid}>
          {experts.map((expert, index) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              onPress={handleExpertPress}
              index={index}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Gemma 4 • Running locally on your device
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.huge },
  header: {
    paddingTop: Spacing.huge + Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  headerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 200,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  logoIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.accentPurple + '15',
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logoText: { ...Typography.h1, color: Colors.textPrimary },
  tagline: {
    ...Typography.body, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: Spacing.xl,
  },
  signOutButton: {
    position: 'absolute',
    top: Spacing.huge,
    right: Spacing.xl,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statsBar: {
    flexDirection: 'row', backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.glassBorder, paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl, alignItems: 'center',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: {
    ...Typography.h3, color: Colors.accentPurple, marginBottom: 2,
  },
  statLabel: { ...Typography.caption, color: Colors.textTertiary },
  statDivider: {
    width: 1, height: 28, backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label, color: Colors.textTertiary,
    marginRight: Spacing.md,
  },
  sectionLine: {
    flex: 1, height: 1, backgroundColor: Colors.divider,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  footer: {
    alignItems: 'center', paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  footerText: { ...Typography.caption, color: Colors.textTertiary },
});
