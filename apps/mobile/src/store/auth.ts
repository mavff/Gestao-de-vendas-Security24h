import * as Keychain from 'react-native-keychain';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Keychain.setGenericPassword('token', JSON.stringify({ accessToken, refreshToken }));
}

export async function readTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const data = await Keychain.getGenericPassword();
  if (!data) return null;
  return JSON.parse(data.password);
}
