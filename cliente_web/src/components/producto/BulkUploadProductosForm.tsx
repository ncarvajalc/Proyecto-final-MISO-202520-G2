import { toast } from "sonner";

import { createCsvBulkUploadForm } from "@/components/common/createCsvBulkUploadForm";
import { showBulkUploadError } from "@/components/common/bulkUploadNotifications";
import { bulkUploadProductos } from "@/services/productos.service";

const PRODUCTOS_TEMPLATE = `sku,nombre,descripcion,precio,especificaciones,urlManual,urlHojaInstalacion,certificaciones
MED-001,Paracetamol 500mg,Analgésico y antipirético,5000,"[{""nombre"":""Presentación"",""valor"":""Caja x 20""}]",https://ejemplo.com/manual.pdf,https://ejemplo.com/instalacion.pdf,"INVIMA,FDA"
MED-002,Ibuprofeno 400mg,Antiinflamatorio,8500,"[{""nombre"":""Presentación"",""valor"":""Caja x 30""}]",,,INVIMA`;
export const BulkUploadProductosForm = createCsvBulkUploadForm({
  title: "Carga masiva productos",
  description:
    "Cargue un archivo csv con la información de los productos que desee cargar. Descargue la plantilla y súbala con los datos llenos.",
  templateContent: PRODUCTOS_TEMPLATE,
  templateFileName: "plantilla_productos.csv",
  upload: bulkUploadProductos,
  context: "productos",
  onSuccess: ({ data }) => {
    const status = data.success ? "exitoso" : "fallido";
    const total_rows = data.totalRows;
    const successful_rows = data.succeededRows;
    const failed_rows = data.failedRows;
    const errors = data.errors;

    const resumenGeneral = `Proceso: ${status}. Se intentaron procesar ${total_rows} filas.
      Resultados: ${successful_rows} exitosas y ${failed_rows} con errores.`;

    if (failed_rows > 0 && Array.isArray(errors)) {
      const detalleErrores = errors
        .map((error) => `Fila ${error.row_number}: ${error.error_message}`)
        .join("\n");

      const mensajeCompleto = `${resumenGeneral}\n--- DETALLE DE ERRORES ---\n${detalleErrores}`;

      toast.error("Carga Masiva Procesada con novedades", {
        description: mensajeCompleto,
        duration: 20000,
      });
    } else {
      toast.success("Carga masiva exitosa", {
        description: resumenGeneral,
        duration: 5000,
      });
    }
  },
  onError: showBulkUploadError,
  queryKey: "productos",
});
