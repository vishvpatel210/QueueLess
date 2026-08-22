import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Palette } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={Palette.mutedText}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 52,
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    color: Palette.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  inputError: {
    borderColor: Palette.danger,
  },
  errorText: {
    fontSize: 12,
    color: Palette.danger,
    marginTop: 4,
  },
});

export default Input;
