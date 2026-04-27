import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

export default function AuthScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session]);

  async function signInWithEmail() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) setMessage({ text: error.message, type: 'error' });
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    setMessage(null);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else if (!session) {
      setMessage({ text: 'Please check your inbox for email verification!', type: 'success' });
    }
    setLoading(false);
  }

  const handleSubmit = isSignUp ? signUpWithEmail : signInWithEmail;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED20', '#3B82F610', 'transparent']}
        style={styles.headerGlow}
      />
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="chatbubbles" size={32} color={Colors.accentPurple} />
            </View>
            <Text style={styles.title}>Infinity Talks</Text>
            <Text style={styles.subtitle}>{isSignUp ? 'Create an account to continue' : 'Welcome back'}</Text>
          </View>

          <View style={styles.form}>
            {message && (
              <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                placeholder="••••••••"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Pressable 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              <LinearGradient
                colors={Colors.gradientPrimary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable 
              style={styles.switchButton} 
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 300,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.accentPurple + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  form: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.card,
  },
  messageBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: Colors.accentRed + '20',
    borderColor: Colors.accentRed + '50',
  },
  messageSuccess: {
    backgroundColor: Colors.accentGreen + '20',
    borderColor: Colors.accentGreen + '50',
  },
  messageText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  button: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.h3,
    color: '#FFF',
  },
  switchButton: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  switchText: {
    ...Typography.bodySmall,
    color: Colors.accentPurple,
  },
});
