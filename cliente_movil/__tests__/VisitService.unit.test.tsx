import { visitService } from "../src/services/visitService";
import { VisitCreate, Visit } from "../src/types/visit";

jest.mock("../src/config/api", () => ({
  __esModule: true,
  getApiBaseUrl: jest.fn(() => "http://api.example.com"),
}));

const originalFetch = global.fetch;
const mockFetch = jest.fn();

describe("visitService", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("createVisit without files", () => {
    it("envía la solicitud POST con JSON cuando no hay archivos multimedia", async () => {
      const visitPayload: VisitCreate = {
        nombre_institucion: "Institución ABC",
        direccion: "Calle 123",
        hora: "2024-11-20T10:00:00.000Z",
        estado: "Programada",
        observacion: "Llevar material",
        desplazamiento_minutos: 25,
      };

      const mockResponse: Visit = {
        id: "visit-123",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: 25,
        hora_salida: null,
        observacion: visitPayload.observacion || null,
        multimedia: [],
        created_at: "2024-11-20T10:00:00.000Z",
        updated_at: "2024-11-20T10:00:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await visitService.createVisit(visitPayload);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith("http://api.example.com/visitas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitPayload),
      });
    });

    it("lanza un error cuando la API responde con estado no exitoso", async () => {
      const visitPayload: VisitCreate = {
        nombre_institucion: "Institución ABC",
        direccion: "Calle 123",
        hora: "2024-11-20T10:00:00.000Z",
        estado: "Programada",
      };

      mockFetch.mockResolvedValue({ ok: false });

      await expect(visitService.createVisit(visitPayload)).rejects.toThrow(
        "Error al crear visita"
      );
    });
  });

  describe("createVisit with multimedia files", () => {
    it("envía la solicitud POST con FormData cuando hay archivos multimedia", async () => {
      const visitPayload: VisitCreate = {
        nombre_institucion: "Hospital Central",
        direccion: "Av. Principal 456",
        hora: "2024-11-20T14:00:00.000Z",
        estado: "Programada",
        desplazamiento_minutos: 30,
        observacion: "Llevar evidencias fotográficas",
        files: [
          {
            uri: "file:///path/to/image1.jpg",
            name: "image1.jpg",
            type: "image/jpeg",
          },
          {
            uri: "file:///path/to/video1.mp4",
            name: "video1.mp4",
            type: "video/mp4",
          },
        ],
      };

      const mockResponse: Visit = {
        id: "visit-456",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: visitPayload.desplazamiento_minutos!,
        hora_salida: null,
        observacion: visitPayload.observacion!,
        multimedia: [
          {
            id: "media-1",
            visit_id: "visit-456",
            file_name: "image1.jpg",
            file_type: "image/jpeg",
            file_size: 524288,
            created_at: "2024-11-20T14:00:00.000Z",
            updated_at: "2024-11-20T14:00:00.000Z",
          },
          {
            id: "media-2",
            visit_id: "visit-456",
            file_name: "video1.mp4",
            file_type: "video/mp4",
            file_size: 2097152,
            created_at: "2024-11-20T14:00:00.000Z",
            updated_at: "2024-11-20T14:00:00.000Z",
          },
        ],
        created_at: "2024-11-20T14:00:00.000Z",
        updated_at: "2024-11-20T14:00:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await visitService.createVisit(visitPayload);

      expect(result).toEqual(mockResponse);
      expect(result.multimedia).toHaveLength(2);
      expect(result.multimedia![0].file_name).toBe("image1.jpg");
      expect(result.multimedia![1].file_name).toBe("video1.mp4");

      // Verify FormData was used
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("http://api.example.com/visitas/");
      expect(callArgs[1].method).toBe("POST");
      expect(callArgs[1].headers).toEqual({});  // No Content-Type for FormData
      expect(callArgs[1].body).toBeInstanceOf(FormData);
    });

    it("incluye todos los campos del formulario en FormData", async () => {
      const visitPayload: VisitCreate = {
        nombre_institucion: "Clínica del Norte",
        direccion: "Calle 50 #20-30",
        hora: "2024-11-21T09:00:00.000Z",
        hora_salida: "2024-11-21T11:00:00.000Z",
        estado: "Programada",
        desplazamiento_minutos: 45,
        observacion: "Primera visita del mes",
        files: [
          {
            uri: "file:///path/to/document.pdf",
            name: "document.pdf",
            type: "application/pdf",
          },
        ],
      };

      const mockResponse: Visit = {
        id: "visit-789",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: visitPayload.desplazamiento_minutos || null,
        hora_salida: visitPayload.hora_salida || null,
        observacion: visitPayload.observacion || null,
        multimedia: [
          {
            id: "media-3",
            visit_id: "visit-789",
            file_name: "document.pdf",
            file_type: "application/pdf",
            file_size: 102400,
            created_at: "2024-11-21T09:00:00.000Z",
            updated_at: "2024-11-21T09:00:00.000Z",
          },
        ],
        created_at: "2024-11-21T09:00:00.000Z",
        updated_at: "2024-11-21T09:00:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await visitService.createVisit(visitPayload);

      expect(result).toEqual(mockResponse);
      expect(result.multimedia).toHaveLength(1);
      expect(result.multimedia![0].file_name).toBe("document.pdf");

      // Verify FormData was used
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("http://api.example.com/visitas/");
      expect(callArgs[1].method).toBe("POST");
      expect(callArgs[1].headers).toEqual({});  // No Content-Type for FormData
      expect(callArgs[1].body).toBeInstanceOf(FormData);
    });

    it("maneja correctamente archivos multimedia vacíos", async () => {
      const visitPayload: VisitCreate = {
        nombre_institucion: "Centro Médico",
        direccion: "Carrera 10 #15-20",
        hora: "2024-11-22T10:00:00.000Z",
        estado: "Programada",
        files: [],
      };

      const mockResponse: Visit = {
        id: "visit-empty",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: null,
        hora_salida: null,
        observacion: null,
        multimedia: [],
        created_at: "2024-11-22T10:00:00.000Z",
        updated_at: "2024-11-22T10:00:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await visitService.createVisit(visitPayload);

      // Should use JSON since files array is empty
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
      expect(typeof callArgs[1].body).toBe("string");
    });
  });
});
