import { visitService } from "../src/services/visitService";
import { VisitCreate } from "../src/types/visit";

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

  it("envía la solicitud POST con los datos de la visita a registrar", async () => {
    const visitPayload: VisitCreate = {
      nombre_institucion: "Institución ABC",
      direccion: "Calle 123",
      hora: "2024-11-20T10:00:00.000Z",
      estado: "Programada",
      observacion: "Llevar material",
      desplazamiento_minutos: 25,
    };

    mockFetch.mockResolvedValue({ ok: true });

    await expect(visitService.createVisit(visitPayload)).resolves.toBeUndefined();

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
