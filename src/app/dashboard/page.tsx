import FocuraApp from "@/components/focura-app";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <FocuraApp />
    </AuthGuard>
  );
}
