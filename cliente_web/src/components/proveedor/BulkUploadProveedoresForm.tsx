import { toast } from "sonner";

import { createCsvBulkUploadForm } from "@/components/common/createCsvBulkUploadForm";
import { bulkUploadProveedores } from "@/services/proveedores.service";
import type { BulkUploadResponse } from "@/types/proveedor";

const PROVEEDORES_TEMPLATE = `nombre,id_tax,direccion,telefono,correo,contacto,estado,certificadoNombre,certificadoCuerpo,certificadoFechaCertificacion,certificadoFechaVencimiento,certificadoUrl
Farmacéutica Ejemplo S.A.,900123456-1,Calle 123 #45-67,+57 1 234 5678,contacto@ejemplo.com,Juan Pérez,Activo,ISO 9001,ICONTEC,2024-01-15,2025-01-15,https://ejemplo.com/cert.pdf
Distribuidora Demo Ltda.,800234567-2,Carrera 45 #12-34,+57 4 345 6789,ventas@demo.com,María García,Activo,,,,,`;
export const BulkUploadProveedoresForm = createCsvBulkUploadForm<BulkUploadResponse, Error & { detail?: string }>({
  title: "Carga masiva proveedores",
  description:
    "Cargue un archivo csv con la información de los proveedores que desee cargar. Descargue la plantilla y súbala con los datos llenos.",
  templateContent: PROVEEDORES_TEMPLATE,
  templateFileName: "plantilla_proveedores.csv",
  upload: bulkUploadProveedores,
  context: "proveedores",
  onSuccess: ({ data }) => {
    const hasErrors = data.summary.failed > 0;
    const title = hasErrors
      ? "Carga masiva con observaciones"
      : "Carga masiva exitosa";
    const description = hasErrors
      ? `${data.summary.succeeded} proveedores creados y ${data.summary.failed} con errores.`
      : data.message;

    toast.success(title, {
      description,
    });

  },
  onError: (error: Error & { detail?: string }) => {
    toast.error("Error en carga masiva", {
      description: error.detail ?? error.message,
    });
  },
  queryKey: "proveedores",
});
