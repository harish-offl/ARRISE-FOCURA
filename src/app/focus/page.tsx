import { AuthGuard } from "@/components/auth-guard";
import { FocusMode } from "@/components/focus-mode";

export default function FocusPage() {
  return (
    <AuthGuard>
      <FocusMode />
    </AuthGuard>
  );
}
