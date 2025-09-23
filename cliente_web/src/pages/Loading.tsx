"use client";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
const SpinnerLoading = () => {
  return (
    <div className="h-screen flex justify-center items-center">
      <Spinner variant="circle" className="text-primary" />
    </div>
  );
};
export default SpinnerLoading;
