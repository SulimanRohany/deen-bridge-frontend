import ProtectedRoute from "@/components/ProtectedRoute";

export default function ParentDashboard() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Parent Dashboard</h1>
      </div>
    </ProtectedRoute>
  );
}