import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { api, setAccessToken } from '../services/api';
import { saveTokens } from '../store/auth';
import { colors } from '../theme/colors';

export function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { username, password });
      await saveTokens(data.accessToken, data.refreshToken);
      setAccessToken(data.accessToken);
      navigation.replace('MainTabs');
    } catch {
      setError('Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, padding: 20, justifyContent: 'center' }}>
      <Text style={{ color: colors.gold, fontSize: 26, fontWeight: '700', marginBottom: 20 }}>Security24h CRM</Text>
      <Input value={username} onChangeText={setUsername} placeholder="Usuário" />
      <Input value={password} onChangeText={setPassword} placeholder="Senha" secureTextEntry />
      {error ? <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text> : null}
      <Button title="Entrar" onPress={handleLogin} loading={loading} />
    </View>
  );
}
