import type { CSSProperties } from 'react';
import { theme } from '../../../components/common/theme';

export const inputStyle: CSSProperties = { background: theme.soft, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, width: '100%', fontSize: 14 };
export const labelStyle: CSSProperties = { display: 'block', fontSize: 13, color: theme.muted, marginBottom: 4, marginTop: 4 };
export const btnGold: CSSProperties = { background: theme.gold, border: 'none', borderRadius: 10, color: '#111', padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
export const btnSoft: CSSProperties = { background: theme.soft, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, padding: '10px 16px', cursor: 'pointer', fontSize: 14 };
export const qtyBtnStyle: CSSProperties = { width: 34, height: 34, borderRadius: 8, background: theme.soft, border: `1px solid ${theme.border}`, color: theme.text, cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
