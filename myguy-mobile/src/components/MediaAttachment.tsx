import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export type SharedMediaType = 'image' | 'video' | 'file';

export interface SharedMediaAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  type: SharedMediaType;
}

interface MediaPickerSheetProps {
  visible: boolean;
  includeFiles?: boolean;
  onClose: () => void;
  onSelect: (asset: SharedMediaAsset) => void;
  onError: (message: string) => void;
}

const fileMimeTypes: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  rtf: 'application/rtf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

const supportedFileTypes = Object.values(fileMimeTypes);

function inferMediaType(mimeType?: string | null): SharedMediaType {
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  return 'file';
}

function normalizeImageAsset(asset: ImagePicker.ImagePickerAsset): SharedMediaAsset {
  return {
    uri: asset.uri,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    type: asset.type === 'video' ? 'video' : 'image',
  };
}

export function MediaPickerSheet({
  visible,
  includeFiles = false,
  onClose,
  onSelect,
  onError,
}: MediaPickerSheetProps) {
  const [busy, setBusy] = useState(false);

  const runPicker = async (picker: () => Promise<SharedMediaAsset | null>) => {
    if (busy) return;
    setBusy(true);
    try {
      const asset = await picker();
      if (asset) {
        onSelect(asset);
        onClose();
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not open the selected media source.');
    } finally {
      setBusy(false);
    }
  };

  const chooseGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Allow MyGuy to access your library to choose photos or videos.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    return result.canceled ? null : normalizeImageAsset(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Allow MyGuy to use your camera to take a photo.');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    return result.canceled ? null : normalizeImageAsset(result.assets[0]);
  };

  const recordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Allow MyGuy to use your camera to record a video.');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
    });
    return result.canceled ? null : normalizeImageAsset(result.assets[0]);
  };

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: supportedFileTypes,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    const extension = asset.name.split('.').pop()?.toLowerCase();
    return {
      uri: asset.uri,
      fileName: asset.name,
      mimeType: asset.mimeType || (extension ? fileMimeTypes[extension] : undefined) || null,
      type: inferMediaType(asset.mimeType || (extension ? fileMimeTypes[extension] : undefined)),
    };
  };

  const options: Array<{
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    action: () => Promise<SharedMediaAsset | null>;
  }> = [
    { title: 'Choose from gallery', subtitle: 'Pick a photo or video already on your device', icon: 'images-outline', action: chooseGallery },
    { title: 'Take a picture', subtitle: 'Capture a fresh photo with your camera', icon: 'camera-outline', action: takePhoto },
    { title: 'Record a video', subtitle: 'Record a clip up to 60 seconds', icon: 'videocam-outline', action: recordVideo },
    ...(includeFiles ? [{ title: 'Browse files', subtitle: 'Attach a PDF or supported document', icon: 'document-attach-outline' as const, action: chooseFile }] : []),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} accessibilityLabel="Close media choices" />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.heading}>
            <View>
              <Text style={styles.title}>Add something to share</Text>
              <Text style={styles.subtitle}>Choose how you want to add it</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close media choices" onPress={onClose}>
              <Ionicons name="close-circle-outline" size={27} color="#6b625b" />
            </TouchableOpacity>
          </View>
          {options.map((option) => (
            <TouchableOpacity
              key={option.title}
              accessibilityRole="button"
              disabled={busy}
              style={styles.option}
              onPress={() => void runPicker(option.action)}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon} size={21} color="#0f766e" />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9a6b51" />
            </TouchableOpacity>
          ))}
          {busy && <ActivityIndicator color="#0f766e" style={styles.busy} />}
          <Text style={styles.footnote}>
            {Platform.OS === 'web' ? 'Your browser may ask for camera permission.' : 'Photos and clips are shared as media, not as file cards.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export function MediaAttachmentPreview({
  asset,
  onRemove,
}: {
  asset: SharedMediaAsset;
  onRemove: () => void;
}) {
  return (
    <View style={previewStyles.container}>
      {asset.type === 'image' ? (
        <Image source={{ uri: asset.uri }} style={previewStyles.media} resizeMode="cover" />
      ) : asset.type === 'video' ? (
        <View style={previewStyles.videoWrap}>
          <Video
            source={{ uri: asset.uri }}
            style={previewStyles.media}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay={false}
          />
        </View>
      ) : (
        <View style={previewStyles.fileCard}>
          <Ionicons name="document-text-outline" size={24} color="#0f766e" />
          <Text style={previewStyles.fileName} numberOfLines={2}>{asset.fileName || 'Attached document'}</Text>
        </View>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Remove selected attachment"
        style={previewStyles.remove}
        onPress={onRemove}
      >
        <Ionicons name="close" size={17} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(21,18,16,0.44)' },
  scrim: { flex: 1 },
  sheet: { paddingHorizontal: 19, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#fffaf5' },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#d6c9bd', marginBottom: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  title: { color: '#292524', fontSize: 17, fontWeight: '800' },
  subtitle: { color: '#6b625b', fontSize: 11, marginTop: 3 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 66, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: '#f1e8df' },
  optionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e3f4ec' },
  optionCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  optionTitle: { color: '#292524', fontSize: 13, fontWeight: '800' },
  optionSubtitle: { color: '#6b625b', fontSize: 10, marginTop: 3 },
  busy: { marginTop: 10 },
  footnote: { color: '#9a6b51', textAlign: 'center', fontSize: 10, marginTop: 13 },
});

const previewStyles = StyleSheet.create({
  container: { height: 170, marginTop: 10, overflow: 'hidden', borderRadius: 14, backgroundColor: '#fff1e5' },
  media: { width: '100%', height: '100%' },
  videoWrap: { flex: 1, backgroundColor: '#151210' },
  fileCard: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 14 },
  fileName: { maxWidth: '75%', color: '#292524', fontSize: 12, fontWeight: '700' },
  remove: { width: 28, height: 28, position: 'absolute', right: 8, top: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(21,18,16,0.75)' },
});
