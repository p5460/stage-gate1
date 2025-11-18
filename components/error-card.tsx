import { CardWrapper } from "@/components/auth/card-wrapper";
import { BsExclamationTriangleFill } from "react-icons/bs";

export const ErrorCard = () => {
  return (
    <CardWrapper
      headerLabel="Opps! Something went wrong!"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
    >
      <div className="items-center justify-center flex w-full">
        <BsExclamationTriangleFill className="text-destructive" />
      </div>
    </CardWrapper>
  );
};
