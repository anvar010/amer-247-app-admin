import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amer-700 text-2xl text-white shadow-lg shadow-amer-700/30">
        !
      </div>
      <h1 className="text-xl font-bold text-ink">No admin access</h1>
      <p className="max-w-sm text-sm text-muted">
        Your account is signed in but doesn&apos;t have the admin role. Ask an existing admin to grant
        access in the database, then sign in again.
      </p>
      <Link
        href="/login"
        className="mt-3 rounded-full bg-amer-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amer-700/30 hover:bg-amer-600"
      >
        Back to sign in
      </Link>
    </div>
  );
}
