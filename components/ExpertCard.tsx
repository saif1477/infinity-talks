import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Expert } from '../data/experts';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.xl * 2 - CARD_MARGIN) / 2;

interface Props {
  expert: Expert;
  onPress: (expert: Expert) => void;
  index: number;
}

export default function ExpertCard({ expert, onPress, index }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95, useNativeDriver: true, damping: 15, stiffness: 200,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, useNativeDriver: true, damping: 15, stiffness: 200,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <Pressable onPress={() => onPress(expert)} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.pressable}>
        <LinearGradient
          colors={[expert.gradient[0] + '40', expert.gradient[1] + '20', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
        <View style={styles.cardContent}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarGlow, Shadows.glow(expert.color)]} />
            <LinearGradient colors={expert.gradient} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Image source={expert.avatar} style={styles.avatarImage} resizeMode="cover" />
              </View>
            </LinearGradient>
          </View>
          <Text style={styles.name} numberOfLines={1}>{expert.name}</Text>
          <Text style={[styles.title, { color: expert.color }]} numberOfLines={1}>{expert.title}</Text>
          <Text style={styles.era}>{expert.era}</Text>
          <View style={[styles.domainBadge, { borderColor: expert.color + '30' }]}>
            <Text style={[styles.domainText, { color: expert.color }]}>{expert.domain}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { width: CARD_WIDTH, marginBottom: Spacing.lg },
  pressable: {
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.glassBorder, ...Shadows.card,
  },
  gradientBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
  },
  cardContent: {
    alignItems: 'center', paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg, paddingHorizontal: Spacing.md,
  },
  avatarContainer: { marginBottom: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 72, height: 72, borderRadius: 36 },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36, padding: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 34,
    overflow: 'hidden', backgroundColor: Colors.backgroundSecondary,
  },
  avatarImage: { width: '100%', height: '100%' },
  name: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center', marginBottom: 2 },
  title: { ...Typography.bodySmall, textAlign: 'center', marginBottom: 2 },
  era: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginBottom: Spacing.sm },
  domainBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: BorderRadius.pill, borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  domainText: { ...Typography.caption, textAlign: 'center' },
});
