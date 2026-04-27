import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const SettingItem = ({ icon, label, onPress, color = Colors.textPrimary, isLast = false }: any) => (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingItem,
        pressed && styles.settingItemPressed,
        isLast && { borderBottomWidth: 0 }
      ]}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.settingLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={handleSignOut} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.accentRed} />
            ) : (
              <Ionicons name="log-out-outline" size={24} color={Colors.accentRed} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={Colors.gradientPrimary}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={48} color="#FFF" />
            </LinearGradient>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </View>

          <Text style={styles.emailText}>{session?.user?.email || 'Guest User'}</Text>
          <Text style={styles.subText}>Premium Member</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.card}>
            <SettingItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
            <SettingItem icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => {}} />
            <SettingItem icon="color-palette-outline" label="Appearance" onPress={() => {}} isLast={true} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <View style={styles.card}>
            <SettingItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
            <SettingItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} isLast={true} />
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Pressable 
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              loading && styles.logoutButtonDisabled
            ]} 
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.accentRed} />
            ) : (
              <>
              <Ionicons name="log-out" size={20} color="#FFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </Pressable>
          <Text style={styles.versionText}>Version 1.0.0 (Gemma 4 Edition)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.huge,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow(Colors.accentPurple),
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accentPurple,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  emailText: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subText: {
    ...Typography.body,
    color: Colors.accentPurple,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    ...Shadows.card,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingItemPressed: {
    backgroundColor: Colors.glassHover,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingLabel: {
    flex: 1,
    ...Typography.body,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentRed,
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accentRed,
    marginBottom: Spacing.xl,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutText: {
    ...Typography.h3,
    color: '#FFF',
    marginLeft: Spacing.sm,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});

