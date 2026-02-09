import { ProtectedRoute } from '../../src/components/layout/ProtectedRoute';
import { KanbanPage } from '../../src/modules/kanban/KanbanPage';

export default function Page() {
  return <ProtectedRoute><KanbanPage /></ProtectedRoute>;
}
