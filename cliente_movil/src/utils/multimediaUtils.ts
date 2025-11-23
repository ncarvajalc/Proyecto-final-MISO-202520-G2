import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import { MultimediaFile } from '../types/visit';
import { Alert } from 'react-native';

const MAX_VIDEO_DURATION_SECONDS = 10;
const IMAGE_COMPRESSION_QUALITY = 0.5; // 50% quality to reduce size
const MAX_IMAGE_WIDTH = 1024; // Max width for images
const MAX_IMAGE_HEIGHT = 1024; // Max height for images

/**
 * Request permissions for camera and media library
 */
export const requestMediaPermissions = async (): Promise<boolean> => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
    Alert.alert(
      'Permisos requeridos',
      'Se necesitan permisos de cámara y galería para agregar multimedia.'
    );
    return false;
  }

  return true;
};

/**
 * Compress an image to reduce file size
 */
export const compressImage = async (uri: string): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
            height: MAX_IMAGE_HEIGHT,
          },
        },
      ],
      {
        compress: IMAGE_COMPRESSION_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
};

/**
 * Get video duration in seconds
 */
export const getVideoDuration = async (uri: string): Promise<number> => {
  try {
    const { sound, status } = await Audio.Sound.createAsync(
      { uri },
      {},
      null,
      false
    );

    if (status.isLoaded && status.durationMillis) {
      const durationSeconds = status.durationMillis / 1000;
      await sound.unloadAsync();
      return durationSeconds;
    }

    return 0;
  } catch (error) {
    // Fallback: could not get video duration with Audio API
    console.error('Error getting video duration:', error);
    // Return 0 as fallback; rely on picker options to limit duration
    return 0;
  }
};

/**
 * Validate video duration (max 10 seconds)
 */
export const validateVideoDuration = (durationSeconds: number): boolean => {
  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    Alert.alert(
      'Video demasiado largo',
      `El video no puede exceder ${MAX_VIDEO_DURATION_SECONDS} segundos. Duración actual: ${Math.round(durationSeconds)}s`
    );
    return false;
  }
  return true;
};

/**
 * Launch camera to take a photo
 */
export const takePhoto = async (): Promise<MultimediaFile | null> => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: IMAGE_COMPRESSION_QUALITY,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    // Compress the image
    const compressedUri = await compressImage(asset.uri);

    const fileName = `photo_${Date.now()}.jpg`;

    return {
      uri: compressedUri,
      name: fileName,
      type: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'No se pudo tomar la foto');
    return null;
  }
};

/**
 * Launch camera to record a video
 */
export const recordVideo = async (): Promise<MultimediaFile | null> => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.5, // Low quality to reduce file size
      videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    // Validate duration (though the picker should enforce it)
    if (asset.duration) {
      const durationSeconds = asset.duration / 1000;
      if (!validateVideoDuration(durationSeconds)) {
        return null;
      }
    }

    const fileName = `video_${Date.now()}.mp4`;

    return {
      uri: asset.uri,
      name: fileName,
      type: 'video/mp4',
    };
  } catch (error) {
    console.error('Error recording video:', error);
    Alert.alert('Error', 'No se pudo grabar el video');
    return null;
  }
};

/**
 * Pick an image from gallery
 */
export const pickImage = async (): Promise<MultimediaFile | null> => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: IMAGE_COMPRESSION_QUALITY,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    // Compress the image
    const compressedUri = await compressImage(asset.uri);

    const fileName = asset.fileName || `image_${Date.now()}.jpg`;

    return {
      uri: compressedUri,
      name: fileName,
      type: asset.mimeType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'No se pudo seleccionar la imagen');
    return null;
  }
};

/**
 * Pick a video from gallery
 */
export const pickVideo = async (): Promise<MultimediaFile | null> => {
  try {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.5,
      videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    // Validate duration
    if (asset.duration) {
      const durationSeconds = asset.duration / 1000;
      if (!validateVideoDuration(durationSeconds)) {
        return null;
      }
    }

    const fileName = asset.fileName || `video_${Date.now()}.mp4`;

    return {
      uri: asset.uri,
      name: fileName,
      type: asset.mimeType || 'video/mp4',
    };
  } catch (error) {
    console.error('Error picking video:', error);
    Alert.alert('Error', 'No se pudo seleccionar el video');
    return null;
  }
};

/**
 * Get file size from URI (approximation for React Native)
 */
export const getFileSize = (uri: string): number => {
  // This is an approximation - in a real app you'd use react-native-fs or similar
  // For now, we'll return a reasonable estimate
  return 0; // Will be populated when the file is actually read
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
