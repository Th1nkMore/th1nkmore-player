import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { getSafeAdminNextPath } from "@/lib/admin-auth-policy";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams?.next;

  return (
    <AdminLoginScreen
      nextPath={getSafeAdminNextPath(
        typeof nextPath === "string" ? nextPath : undefined,
      )}
    />
  );
}
