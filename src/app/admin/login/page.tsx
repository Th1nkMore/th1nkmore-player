import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

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
      nextPath={typeof nextPath === "string" ? nextPath : undefined}
    />
  );
}
