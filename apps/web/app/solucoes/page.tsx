import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { SolucoesPage } from '../../src/modules/solucoes/SolucoesPage';

export default function Page() {
  return <ProtectedRoute><SolucoesPage /></ProtectedRoute>;
}
