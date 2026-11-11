import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export function ThemedTextInput({ style, ...props }: TextInputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textSecondary}
      selectionColor={colors.accent}
      style={[{ color: colors.text }, style]}
    />
  );
}
