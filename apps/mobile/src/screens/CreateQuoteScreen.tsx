import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { api } from '../services/api';
import { colors } from '../theme/colors';

export function CreateQuoteScreen() {
  const [clienteNome, setClienteNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [msg, setMsg] = useState('');

  async function save() {
    const quote = await api.post('/quotes', { clienteNome });
    await api.post(`/quotes/${quote.data.codInterno}/items`, { items: [{ codProduto: 1, descricao, quantidade: 1, unitario: 100 }] });
    setMsg('Orçamento criado');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, padding: 16 }}>
      <Input value={clienteNome} onChangeText={setClienteNome} placeholder="Cliente" />
      <Input value={descricao} onChangeText={setDescricao} placeholder="Descrição item" />
      <Button title="Criar orçamento" onPress={save} />
      <Text style={{ color: colors.gold, marginTop: 10 }}>{msg}</Text>
    </View>
  );
}
