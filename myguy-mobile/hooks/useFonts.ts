import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export const useFonts = async () => {
  await Font.loadAsync({
    ...Ionicons.font,
  });
};