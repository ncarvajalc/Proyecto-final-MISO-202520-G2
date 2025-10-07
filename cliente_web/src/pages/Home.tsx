import { CardButton } from "@/components/ui/card-button";
import { Typography1 } from "@/components/ui/typography1";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Typography1>Inicio</Typography1>

      {/* Menu button grid 2x2*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <CardButton
          title="Gestión de catálogos"
          description="Administra proveedores y productos"
          link="/catalogos"
        />
        <CardButton
          title="Gestión comercial"
          description="Gestiona vendedores, planes y reportes"
          link="/comercial"
        />
        <CardButton
          title="Gestión logística"
          description="Controla inventario y rutas de entrega"
          link="/logistica"
        />
      </div>
    </div>
  );
}
