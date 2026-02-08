import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../theme/colors';

export function Button({ title, onPress, loading = false }: { title: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: colors.gold, padding: 12, borderRadius: 8, alignItems: 'center' }}>
      {loading ? <ActivityIndicator color={colors.black} /> : <Text style={{ color: colors.black, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
}
