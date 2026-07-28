import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg border bg-card",
          },
        }}
        forceRedirectUrl="/dashboard"
        signInForceRedirectUrl="/sign-in"
      />
    </div>
  );
}
