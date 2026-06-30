import { db } from "@/lib/db";

export async function generateStaticParams() {
  const tenants = await db.tenant.findMany({ select: { slug: true } });
  return tenants.map((t) => ({ tenantSlug: t.slug }));
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
