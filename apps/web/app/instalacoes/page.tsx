import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { InstalacoesPage } from '../../src/modules/installations/InstalacoesPage';

export default function Page() {
  return <ProtectedRoute><InstalacoesPage /></ProtectedRoute>;
}
