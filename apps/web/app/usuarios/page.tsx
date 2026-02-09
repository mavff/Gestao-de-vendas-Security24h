import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { UsersPage } from '../../src/modules/users/UsersPage';

export default function Page() {
  return <ProtectedRoute><UsersPage /></ProtectedRoute>;
}
