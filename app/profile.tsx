import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { session } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#7C3AED', '#3B82F6']}
            style={styles.avatarGradient}
          >
            <Ionicons name="person" size={40} color="#FFF" />
          </LinearGradient>
        </View>

        <Text style={styles.emailText}>{session?.user?.email}</Text>
        <Text style={styles.subText}>Infinity Talks Member</Text>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subText: {
    ...Typography.body,
    color: Colors.textTertiary,
    marginBottom: Spacing.huge,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  signOutText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
