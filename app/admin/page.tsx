import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata = {
  title: "Admin · Birthday Experience",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pink-50">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
        </div>
      }
    >
      <AdminPanel />
    </Suspense>
  );
}