import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { colors } from '../theme/colors';

export function Card({ children }: { children: ReactNode }) {
  return <View style={{ backgroundColor: colors.gray900, borderWidth: 1, borderColor: colors.gray700, borderRadius: 10, padding: 12, marginBottom: 10 }}>{children}</View>;
}
