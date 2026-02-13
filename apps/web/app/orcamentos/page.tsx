import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { OrcamentosPage } from '../../src/modules/orcamentos/OrcamentosPage';

export default function Page() {
  return <ProtectedRoute><OrcamentosPage /></ProtectedRoute>;
}
