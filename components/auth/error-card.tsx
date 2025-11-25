"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { useSearchParams } from "next/navigation";
import {
  getUserFriendlyErrorMessage,
  AuthErrorType,
} from "@/lib/auth-error-logger";

export const ErrorCard = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Map NextAuth error codes to our error types
  const getErrorMessage = () => {
    switch (error) {
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "OAuthAccountNotLinked":
        return getUserFriendlyErrorMessage(AuthErrorType.OAUTH_FAILED);
      case "EmailSignin":
      case "CredentialsSignin":
        return getUserFriendlyErrorMessage(AuthErrorType.CREDENTIALS_INVALID);
      case "SessionRequired":
        return getUserFriendlyErrorMessage(AuthErrorType.SESSION_ERROR);
      case "EmailVerification":
        return getUserFriendlyErrorMessage(AuthErrorType.EMAIL_NOT_VERIFIED);
      case "Callback":
        return getUserFriendlyErrorMessage(AuthErrorType.CALLBACK_ERROR);
      case "Default":
      default:
        return "An unexpected error occurred during authentication. Please try again.";
    }
  };

  const errorMessage = getErrorMessage();

  return (
    <CardWrapper
      headerLabel="Authentication Error"
      backButtonHref="/auth/login"
      backButtonLabel="Back to login"
    >
      <div className="w-full space-y-4">
        <div className="flex justify-center items-center">
          <ExclamationTriangleIcon className="text-destructive h-12 w-12" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {error && (
            <p className="text-xs text-muted-foreground">Error code: {error}</p>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};
