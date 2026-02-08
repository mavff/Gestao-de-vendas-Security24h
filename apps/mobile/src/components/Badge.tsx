import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function Badge({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: colors.gold, alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: colors.black, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}
