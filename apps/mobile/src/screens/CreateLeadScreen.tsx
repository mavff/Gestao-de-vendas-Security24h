import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { api } from '../services/api';
import { colors } from '../theme/colors';

export function CreateLeadScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  async function save() {
    await api.post('/leads', { nome, email });
    setNome('');
    setEmail('');
    setMsg('Lead criado com sucesso');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, padding: 16 }}>
      <Input value={nome} onChangeText={setNome} placeholder="Nome" />
      <Input value={email} onChangeText={setEmail} placeholder="Email" />
      <Button title="Criar lead" onPress={save} />
      <Text style={{ color: colors.gold, marginTop: 10 }}>{msg}</Text>
    </View>
  );
}
