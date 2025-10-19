import { CardButton } from "@/components/ui/card-button";
import { Typography1 } from "@/components/ui/typography1";
export default function Catalogos() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Typography1>Gestión de catálogos</Typography1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <CardButton
          title="Proveedores"
          description="Gestiona tus proveedores"
          link="/catalogos/proveedores"
        />
        <CardButton
          title="Productos"
          description="Gestiona tus productos"
          link="/catalogos/productos"
        />
      </div>
    </div>
  );
}
