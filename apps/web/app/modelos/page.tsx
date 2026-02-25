import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { PreOrcamentosPage } from '../../src/modules/pre-orcamentos/PreOrcamentosPage';

export default function Page() {
  return <ProtectedRoute><PreOrcamentosPage /></ProtectedRoute>;
}
