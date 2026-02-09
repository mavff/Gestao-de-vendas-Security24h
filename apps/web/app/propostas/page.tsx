import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { PropostasPage } from '../../src/modules/propostas/PropostasPage';

export default function Page() {
  return <ProtectedRoute><PropostasPage /></ProtectedRoute>;
}
