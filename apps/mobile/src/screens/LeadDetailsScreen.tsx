import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { api } from '../services/api';
import { colors } from '../theme/colors';

export function LeadDetailsScreen({ route }: any) {
  const [lead, setLead] = useState<any>(null);
  const [descricao, setDescricao] = useState('');

  async function load() {
    const { data } = await api.get(`/leads/${route.params.id}`);
    setLead(data);
  }

  async function addTimeline() {
    await api.post(`/leads/${route.params.id}/timeline`, { descricao });
    setDescricao('');
    load();
  }

  useEffect(() => { load(); }, []);

  if (!lead) return <Text style={{ color: colors.white }}>Carregando...</Text>;

  return (
    <ScrollView style={{ backgroundColor: colors.black, padding: 12 }}>
      <Card>
        <Text style={{ color: colors.white, fontWeight: '700' }}>{lead.nome}</Text>
        <Text style={{ color: colors.gray300 }}>{lead.email}</Text>
      </Card>
      <Input value={descricao} onChangeText={setDescricao} placeholder="Adicionar evento na timeline" />
      <Button title="Salvar evento" onPress={addTimeline} />
      <View style={{ marginTop: 16 }}>
        {lead.timeline?.map((item: any) => (
          <Card key={item.codAcao}><Text style={{ color: colors.white }}>{item.descricao}</Text></Card>
        ))}
      </View>
    </ScrollView>
  );
}
