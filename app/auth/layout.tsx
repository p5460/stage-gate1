import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";

export const dynamic = "force-dynamic";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 to-blue-800">
      <AuthErrorBoundary>{children}</AuthErrorBoundary>
    </div>
  );
};
export default AuthLayout;
