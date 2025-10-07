import { CardButton } from "@/components/ui/card-button";
import { Typography1 } from "@/components/ui/typography1";

export default function Comercial() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Typography1>Gestión comercial</Typography1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <CardButton
          title="Vendedores"
          description="Gestiona tus vendedores"
          link="/comercial/vendedores"
        />
        <CardButton
          title="Planes de venta"
          description="Gestiona tus planes de venta"
          link="/comercial/planes-venta"
        />
        <CardButton
          title="Informes comerciales"
          description="Gestiona tus informes"
          link="/comercial/informes-comerciales"
        />
      </div>
    </div>
  );
}
