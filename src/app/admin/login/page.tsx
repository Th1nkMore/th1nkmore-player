import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams?.next;

  return (
    <AdminLoginScreen
      nextPath={typeof nextPath === "string" ? nextPath : undefined}
    />
  );
}
