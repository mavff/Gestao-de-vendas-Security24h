import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { api } from '../services/api';
import { colors } from '../theme/colors';

export function LeadsListScreen({ navigation }: any) {
  const [data, setData] = useState<any[]>([]);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    api.get('/leads?page=1&pageSize=20').then((res) => {
      setData(res.data.items || []);
      setState('done');
    }).catch(() => setState('error'));
  }, []);

  if (state === 'loading') return <Text style={{ color: colors.white }}>Carregando...</Text>;
  if (state === 'error') return <Text style={{ color: colors.danger }}>Erro ao carregar leads.</Text>;
  if (!data.length) return <Text style={{ color: colors.gray300 }}>Nenhum lead encontrado.</Text>;

  return (
    <FlatList style={{ backgroundColor: colors.black, padding: 12 }} data={data} keyExtractor={(item) => String(item.codProspect)} renderItem={({ item }) => (
      <TouchableOpacity onPress={() => navigation.navigate('LeadDetails', { id: item.codProspect })}>
        <Card>
          <Badge text={item.status || 'A'} />
          <Text style={{ color: colors.white, marginTop: 8 }}>{item.nome}</Text>
          <Text style={{ color: colors.gray300 }}>{item.email || 'Sem email'}</Text>
        </Card>
      </TouchableOpacity>
    )} />
  );
}
