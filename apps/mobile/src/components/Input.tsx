import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.gray300} style={{ borderWidth: 1, borderColor: colors.gray700, borderRadius: 8, color: colors.white, padding: 10, marginBottom: 10 }} {...props} />;
}
