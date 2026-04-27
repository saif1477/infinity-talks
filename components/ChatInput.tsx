import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable, Modal, Text, Image, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { modelManager, AVAILABLE_MODELS, ModelId } from '../services/ModelManager';

interface Props {
  accentColor: string;
  gradient: [string, string];
  onSend: (text: string, imageUri?: string) => void;
  editingMessage?: any | null;
  onSaveEdit?: (text: string) => void;
  onCancelEdit?: () => void;
}

export default function ChatInput({ 
  accentColor, 
  gradient, 
  onSend, 
  editingMessage, 
  onSaveEdit, 
  onCancelEdit 
}: Props) {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  // Track by UI ID (e.g. 'gemma-4-e2b'), NOT the webLlmId weight string
  const [selectedModelId, setSelectedModelId] = useState<ModelId | null>(modelManager.getCurrentUIModelId());
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    const active = modelManager.getCurrentUIModelId();
    if (active) setSelectedModelId(active);
  }, []);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (text.trim().length === 0 && !imageUri) return;
    
    if (editingMessage && onSaveEdit) {
      onSaveEdit(text.trim());
    } else {
      onSend(text.trim(), imageUri || undefined);
    }
    
    setText('');
    setImageUri(null);
  };

  const pickImage = async () => {
    // Use UI model ID for vision check
    const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
    if (!activeModel) {
      alert("No model selected. Tap the ∞ symbol to select a model first.");
      return;
    }
    if (!activeModel.supportsVision) {
      alert(`${activeModel.name} does not support images.\n\nSwitch to Gemma 4: E2B or Gemma 4: E4B using the ∞ menu.`);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleModelSelect = async (modelId: ModelId) => {
    if (modelId === selectedModelId && modelManager.isReady()) {
      setShowModelPicker(false);
      return;
    }

    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!model) return;

    try {
      setIsSwapping(true);
      setShowModelPicker(false);
      await modelManager.loadModel(model);
      setSelectedModelId(model.id);
    } catch (e: any) {
      alert(`Failed to load ${model.name}:\n${e.message || e}`);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <Pressable onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
            <Ionicons name="close-circle" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
      )}

      <View style={styles.container}>
        {/* ∞ Model Switcher */}
        <Pressable onPress={() => setShowModelPicker(true)} style={styles.iconBtn}>
          {isSwapping ? (
            <ActivityIndicator color={accentColor} size="small" />
          ) : (
            <Ionicons name="infinite" size={28} color={accentColor} />
          )}
        </Pressable>

        {/* + Image Picker / Cancel Edit */}
        {editingMessage ? (
          <Pressable onPress={onCancelEdit} style={styles.iconBtn}>
            <Ionicons name="close-circle-outline" size={28} color={Colors.accentRed} />
          </Pressable>
        ) : (
          <Pressable onPress={pickImage} style={styles.iconBtn}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.textSecondary} />
          </Pressable>
        )}

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder={editingMessage ? "Edit message..." : "Ask a question..."}
            placeholderTextColor={Colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            onKeyPress={(e) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </View>
        <Pressable onPress={handleSend} style={styles.sendBtn}>
          <LinearGradient colors={gradient} style={styles.sendGradient}>
            <Ionicons name={editingMessage ? "checkmark" : "arrow-up"} size={20} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* Model Picker Modal */}
      <Modal visible={showModelPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Expert Engine</Text>
            {AVAILABLE_MODELS.map(m => {
              const isDownloaded = modelManager.downloadedModels.has(m.id);
              const isActive = m.id === selectedModelId;

              return (
                <Pressable
                  key={m.id}
                  style={[styles.modelOption, isActive && { backgroundColor: accentColor + '20' }]}
                  onPress={() => handleModelSelect(m.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modelOptionName, isActive && { color: accentColor }]}>
                      {m.name}
                    </Text>
                    <Text style={styles.modelOptionMeta}>
                      {m.size} • {m.supportsVision ? '🖼 Vision' : '📝 Text'}
                    </Text>
                  </View>

                  {/* ✅ tick ONLY on active model, ☁️ download if not downloaded, ○ if downloaded but not active */}
                  {isActive ? (
                    <Ionicons name="checkmark-circle" size={22} color={accentColor} />
                  ) : !isDownloaded ? (
                    <Ionicons name="cloud-download-outline" size={22} color={Colors.textTertiary} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={Colors.textTertiary} />
                  )}
                </Pressable>
              );
            })}
            <Pressable style={styles.cancelBtn} onPress={() => setShowModelPicker(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.background },
  container: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  imagePreviewContainer: {
    padding: Spacing.md,
    paddingBottom: 0,
    flexDirection: 'row',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing.md - 10,
    left: 80 + Spacing.md - 10,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  iconBtn: {
    paddingBottom: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1, backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.xl, borderWidth: 1,
    borderColor: Colors.inputBorder, paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0, maxHeight: 100,
  },
  input: { 
    ...Typography.body, 
    color: Colors.textPrimary, 
    maxHeight: 80, 
    paddingVertical: Spacing.sm,
    // @ts-ignore - for web
    outlineStyle: 'none',
    backgroundColor: 'transparent',
  },
  sendBtn: { marginBottom: 2 },
  sendGradient: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  modelOptionName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  modelOptionMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  }
});
