import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="p-4 bg-primary h-screen flex flex-col justify-center items-center text-white">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-2 text-sm text-white">
        Ups, la página que buscas no existe.
      </p>
      <Button variant="default" className="mt-4 text-white" asChild>
        <Link to="/">Volver a la página principal</Link>
      </Button>
    </div>
  );
}
