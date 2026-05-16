import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  React.useEffect(() => {
    if (session?.user?.user_metadata?.avatar_url) {
      setUserAvatar(session.user.user_metadata.avatar_url);
    }
  }, [session]);

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

  const pickImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        const userId = session?.user?.id;
        
        // 1. Convert to Blob for upload and validation
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // 2. Strict File Type Validation
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(blob.type)) {
          alert('Invalid file type. Only PNG, JPEG, and WEBP are accepted.');
          setLoading(false);
          return;
        }

        // 3. Size Validation (2MB)
        if (blob.size > 2 * 1024 * 1024) {
          alert('Image size exceeds 2MB limit.');
          setLoading(false);
          return;
        }

        // 4. Secure Unique Filename Generation
        // Uses UUID and original extension to prevent path traversal and overwriting
        const fileExt = blob.type.split('/')[1] || 'jpg';
        const uniqueId = Crypto.randomUUID();
        const fileName = `${userId}/${uniqueId}.${fileExt}`;

        // 5. Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { 
            contentType: blob.type,
            cacheControl: '3600',
            upsert: false // Security: Prevent overwriting existing files
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Failed to upload image: ' + uploadError.message);
          return;
        }

        // 6. Get Public URL and update profile
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrl }
        });

        if (!updateError) {
          await supabase.auth.refreshSession();
          setUserAvatar(publicUrl);
        } else {
          alert('Failed to update profile: ' + updateError.message);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error picking or uploading image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={handleSignOut} disabled={loading} style={styles.headerLogoutBtn}>
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
          <Pressable onPress={pickImage} style={styles.avatarContainer} disabled={loading}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={Colors.gradientPrimary}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={48} color="#FFF" />
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
            {loading && (
              <View style={[styles.avatarImage, styles.avatarLoading]}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
          </Pressable>

          <Text style={styles.emailText}>{session?.user?.email || 'Guest User'}</Text>
          <Text style={styles.subText}>Infinity Talks Member</Text>
        </View>

        <View style={styles.bottomSection}>
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
  headerLogoutBtn: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
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
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
