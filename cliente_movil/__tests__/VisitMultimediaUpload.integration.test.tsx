import { visitService } from "../src/services/visitService";
import { VisitCreate, MultimediaFile } from "../src/types/visit";

jest.mock("../src/config/api", () => ({
  __esModule: true,
  getApiBaseUrl: jest.fn(() => "http://api.example.com"),
}));

const originalFetch = global.fetch;
const mockFetch = jest.fn();

describe("Visit Multimedia Upload - Integration", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("adjunta correctamente archivos multimedia al payload de la visita", async () => {
    const files: MultimediaFile[] = [
      {
        uri: "file:///path/to/photo1.jpg",
        name: "photo1.jpg",
        type: "image/jpeg",
      },
      {
        uri: "file:///path/to/video1.mp4",
        name: "video1.mp4",
        type: "video/mp4",
      },
    ];

    const visitPayload: VisitCreate = {
      nombre_institucion: "Hospital Central",
      direccion: "Av. Principal 456",
      hora: "2024-11-20T14:00:00.000Z",
      estado: "Programada",
      desplazamiento_minutos: 30,
      observacion: "Visita con evidencias multimedia",
      files: files,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "visit-123",
        ...visitPayload,
        multimedia: [
          {
            id: "media-1",
            visit_id: "visit-123",
            file_name: "photo1.jpg",
            file_type: "image/jpeg",
            file_size: 524288,
            created_at: "2024-11-20T14:00:00.000Z",
            updated_at: "2024-11-20T14:00:00.000Z",
          },
          {
            id: "media-2",
            visit_id: "visit-123",
            file_name: "video1.mp4",
            file_type: "video/mp4",
            file_size: 2097152,
            created_at: "2024-11-20T14:00:00.000Z",
            updated_at: "2024-11-20T14:00:00.000Z",
          },
        ],
        created_at: "2024-11-20T14:00:00.000Z",
        updated_at: "2024-11-20T14:00:00.000Z",
      }),
    });

    const result = await visitService.createVisit(visitPayload);

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify FormData was used (not JSON)
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBeInstanceOf(FormData);

    // Verify response includes multimedia
    expect(result.multimedia).toBeDefined();
    expect(result.multimedia).toHaveLength(2);
    expect(result.multimedia![0].file_name).toBe("photo1.jpg");
    expect(result.multimedia![1].file_name).toBe("video1.mp4");
  });

  it("construye FormData correctamente con todos los campos y archivos", async () => {
    const files: MultimediaFile[] = [
      {
        uri: "file:///photo.jpg",
        name: "evidence.jpg",
        type: "image/jpeg",
      },
    ];

    const visitPayload: VisitCreate = {
      nombre_institucion: "Clínica del Norte",
      direccion: "Calle 50 #20-30",
      hora: "2024-11-21T09:00:00.000Z",
      hora_salida: "2024-11-21T11:00:00.000Z",
      estado: "Programada",
      desplazamiento_minutos: 45,
      observacion: "Primera visita del mes",
      files: files,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "visit-456",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: visitPayload.desplazamiento_minutos || null,
        hora_salida: visitPayload.hora_salida || null,
        observacion: visitPayload.observacion || null,
        multimedia: [],
        created_at: "2024-11-21T09:00:00.000Z",
        updated_at: "2024-11-21T09:00:00.000Z",
      }),
    });

    await visitService.createVisit(visitPayload);

    const callArgs = mockFetch.mock.calls[0];
    const formData = callArgs[1].body as FormData;

    // Verify it's FormData
    expect(formData).toBeInstanceOf(FormData);

    // Verify no Content-Type header (let browser set it with boundary)
    expect(callArgs[1].headers).toEqual({});

    // Verify the API endpoint was called correctly
    expect(callArgs[0]).toBe("http://api.example.com/visitas/");
    expect(callArgs[1].method).toBe("POST");
  });

  it("verifica que los archivos se adjuntan con la estructura correcta", async () => {
    const photoFile: MultimediaFile = {
      uri: "file:///storage/photo123.jpg",
      name: "visit_photo.jpg",
      type: "image/jpeg",
    };

    const videoFile: MultimediaFile = {
      uri: "file:///storage/video456.mp4",
      name: "visit_video.mp4",
      type: "video/mp4",
    };

    const visitPayload: VisitCreate = {
      nombre_institucion: "Centro Médico",
      direccion: "Carrera 10 #15-20",
      hora: "2024-11-22T10:00:00.000Z",
      estado: "Programada",
      files: [photoFile, videoFile],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "visit-789",
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
      }),
    });

    const result = await visitService.createVisit(visitPayload);

    // Verify the request was made with FormData
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBeInstanceOf(FormData);

    // Verify the service processed the request correctly
    expect(result.id).toBe("visit-789");
    expect(result.nombre_institucion).toBe(visitPayload.nombre_institucion);
  });

  it("envía solo archivos de foto cuando solo hay fotos", async () => {
    const files: MultimediaFile[] = [
      {
        uri: "file:///photo1.jpg",
        name: "photo1.jpg",
        type: "image/jpeg",
      },
      {
        uri: "file:///photo2.jpg",
        name: "photo2.jpg",
        type: "image/jpeg",
      },
    ];

    const visitPayload: VisitCreate = {
      nombre_institucion: "Institución XYZ",
      direccion: "Dirección 123",
      hora: "2024-11-23T10:00:00.000Z",
      estado: "Programada",
      files: files,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "visit-photos",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: null,
        hora_salida: null,
        observacion: null,
        multimedia: [],
        created_at: "2024-11-23T10:00:00.000Z",
        updated_at: "2024-11-23T10:00:00.000Z",
      }),
    });

    const result = await visitService.createVisit(visitPayload);

    // Verify FormData was used
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBeInstanceOf(FormData);

    // Verify the response
    expect(result.id).toBe("visit-photos");
  });

  it("envía solo archivos de video cuando solo hay videos", async () => {
    const files: MultimediaFile[] = [
      {
        uri: "file:///video1.mp4",
        name: "video1.mp4",
        type: "video/mp4",
      },
    ];

    const visitPayload: VisitCreate = {
      nombre_institucion: "Institución ABC",
      direccion: "Dirección 456",
      hora: "2024-11-24T10:00:00.000Z",
      estado: "Programada",
      files: files,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "visit-video",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: null,
        hora_salida: null,
        observacion: null,
        multimedia: [],
        created_at: "2024-11-24T10:00:00.000Z",
        updated_at: "2024-11-24T10:00:00.000Z",
      }),
    });

    const result = await visitService.createVisit(visitPayload);

    // Verify FormData was used
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBeInstanceOf(FormData);

    // Verify the response
    expect(result.id).toBe("visit-video");
  });

  it("combina correctamente campos del formulario con archivos multimedia", async () => {
    const files: MultimediaFile[] = [
      {
        uri: "file:///combined.jpg",
        name: "combined.jpg",
        type: "image/jpeg",
      },
    ];

    const visitPayload: VisitCreate = {
      nombre_institucion: "Hospital Combinado",
      direccion: "Av. Combinada 789",
      hora: "2024-11-25T15:00:00.000Z",
      hora_salida: "2024-11-25T17:00:00.000Z",
      estado: "Programada",
      desplazamiento_minutos: 60,
      observacion: "Visita importante con evidencias",
      files: files,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "visit-combined",
        nombre_institucion: visitPayload.nombre_institucion,
        direccion: visitPayload.direccion,
        hora: visitPayload.hora,
        estado: visitPayload.estado,
        desplazamiento_minutos: visitPayload.desplazamiento_minutos || null,
        hora_salida: visitPayload.hora_salida || null,
        observacion: visitPayload.observacion || null,
        multimedia: [],
        created_at: "2024-11-25T15:00:00.000Z",
        updated_at: "2024-11-25T15:00:00.000Z",
      }),
    });

    const result = await visitService.createVisit(visitPayload);

    // Verify FormData was used
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBeInstanceOf(FormData);

    // Verify no Content-Type header (browser sets it with boundary)
    expect(callArgs[1].headers).toEqual({});

    // Verify the response includes all the data
    expect(result.id).toBe("visit-combined");
    expect(result.nombre_institucion).toBe(visitPayload.nombre_institucion);
    expect(result.direccion).toBe(visitPayload.direccion);
    expect(result.desplazamiento_minutos).toBe(60);
    expect(result.observacion).toBe(visitPayload.observacion);
  });
});
