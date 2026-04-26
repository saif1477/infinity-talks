import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { AVAILABLE_MODELS, UIModel, modelManager, ProgressInfo } from '../services/ModelManager';
import { Ionicons } from '@expo/vector-icons';

export default function ModelManagerSheet() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>('');
  const [, forceUpdate] = useState(0); // trigger re-render after download completes

  // Sync state from IndexedDB when component mounts
  useEffect(() => {
    modelManager.syncCacheState().then(() => forceUpdate(n => n + 1));
  }, []);

  const handleDownload = useCallback(async (model: UIModel) => {
    if (modelManager.downloadedModels.has(model.id)) return;

    setDownloading(model.id);
    setProgressText('Preparing engine...');

    try {
      await modelManager.loadModel(model, (progress: ProgressInfo) => {
        setProgressText(progress.text);
      });
    } catch (e) {
      console.error(e);
      setProgressText('Failed to download.');
    }

    setDownloading(null);
    forceUpdate(n => n + 1); // re-render to show checkmark
  }, []);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.headerRow}>
        <View>
          <Text style={styles.title}>AI Models</Text>
          <Text style={styles.subtitle}>Download AI brains to your device</Text>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={Colors.textSecondary} />
      </Pressable>

      {isExpanded && AVAILABLE_MODELS.map((model) => {
        const isDownloaded = modelManager.downloadedModels.has(model.id);
        const isDownloading = downloading === model.id;

        return (
          <View key={model.id} style={styles.modelRow}>
            <View style={styles.modelInfo}>
              <Text style={styles.modelName}>{model.name}</Text>
              <Text style={styles.modelSize}>
                {model.size} • {model.supportsVision ? '🖼 Vision' : '📝 Text Only'}
              </Text>
              {isDownloading && (
                <Text style={styles.progressText} numberOfLines={1}>{progressText}</Text>
              )}
            </View>

            <Pressable
              style={[styles.actionBtn, isDownloaded && styles.downloadedBtn]}
              onPress={() => handleDownload(model)}
              disabled={isDownloaded || isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color={Colors.accentPurple} size="small" />
              ) : isDownloaded ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.accentGreen} />
              ) : (
                <Ionicons name="cloud-download-outline" size={20} color={Colors.accentPurple} />
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginTop: Spacing.lg,
    width: '100%',
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  modelSize: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressText: {
    color: Colors.accentPurple,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentPurple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadedBtn: {
    backgroundColor: Colors.accentGreen + '20',
  }
});
