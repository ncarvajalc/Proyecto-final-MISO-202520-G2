import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CardButtonProps {
  title: string;
  description: string;
  link: string;
  className?: string;
}

function CardButton({ title, description, link, className }: CardButtonProps) {
  return (
    <Link
      to={link}
      className={cn(
        "block rounded-lg border border-brand-200 bg-white p-6 transition-all duration-200 hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
        className
      )}
    >
      <div className="space-y-2 text-left">
        <h3 className="text-2xl text-primary font-semibold text-brand-900 leading-8 tracking-[-0.144px]">
          {title}
        </h3>
        <p className="text-sm">{description}</p>
      </div>
    </Link>
  );
}

export { CardButton };
