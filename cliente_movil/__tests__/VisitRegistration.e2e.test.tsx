import "react-native-gesture-handler/jestSetup";
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "child_process";
import path from "path";
import React from "react";
import { Alert } from "react-native";
import {
  act,
  fireEvent,
  render,
  RenderAPI,
  waitFor,
} from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:5901";

jest.setTimeout(120000);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: App } = require("../App") as { default: React.ComponentType };

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true })),
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const listeners: Array<(event: unknown, date?: Date) => void> = [];

  const MockDateTimePicker = ({
    onChange,
  }: {
    onChange: (event: unknown, date?: Date) => void;
  }) => {
    React.useEffect(() => {
      listeners.push(onChange);
      return () => {
        const index = listeners.indexOf(onChange);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    }, [onChange]);

    return null;
  };

  (MockDateTimePicker as unknown as { __listeners: typeof listeners }).__listeners =
    listeners;

  return MockDateTimePicker;
});

const DateTimePickerMock: {
  __listeners: Array<(event: unknown, date?: Date) => void>;
} = require("@react-native-community/datetimepicker");

const TEST_PORT = Number(new URL(process.env.EXPO_PUBLIC_API_URL!).port || 5901);
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const BACKEND_SCRIPT = path.resolve(__dirname, "./test_backend_server.py");

let backendProcess: ChildProcessWithoutNullStreams | null = null;
let backendDependenciesInstalled = false;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForBackendReady = async (timeoutMs = 15000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Backend not ready yet
    }
    await wait(200);
  }
  throw new Error("Backend server did not start in time");
};

const startBackend = async () => {
  if (backendProcess) {
    return;
  }

  if (!backendDependenciesInstalled) {
    const requirements = [
      path.resolve(__dirname, "..", "..", "backend", "base", "requirements.txt"),
      path.resolve(
        __dirname,
        "..",
        "..",
        "backend",
        "SecurityAndAudit",
        "requirements.txt",
      ),
    ];

    for (const file of requirements) {
      const result = spawnSync("python", ["-m", "pip", "install", "-r", file], {
        cwd: path.resolve(__dirname, "..", ".."),
        encoding: "utf-8",
      });

      if (result.status !== 0) {
        const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
        throw new Error(
          `No se pudieron instalar las dependencias del backend desde ${file}.\n${output}`,
        );
      }
    }

    backendDependenciesInstalled = true;
  }

  backendProcess = spawn("python", [BACKEND_SCRIPT, "--port", String(TEST_PORT)], {
    cwd: path.resolve(__dirname, "..", ".."),
    env: {
      ...process.env,
      TEST_DATABASE_URL: `sqlite:///${path
        .resolve(__dirname, "./data/security_test.db")
        .replace(/\\/g, "/")}`,
      TESTING: "1",
    },
    stdio: "pipe",
  });

  backendProcess.stderr?.on("data", (chunk) => {
    const message = chunk.toString();
    if (message.includes("INFO:")) {
      console.log(`[backend] ${message.trimEnd()}`);
      return;
    }
    console.error(`[backend] ${message}`);
  });

  backendProcess.on("exit", (code, signal) => {
    if (code && code !== 0) {
      console.error(`Test backend exited with code ${code}`);
    }
    if (signal && signal !== "SIGTERM") {
      console.error(`Test backend terminated with signal ${signal}`);
    }
    backendProcess = null;
  });

  await waitForBackendReady();
};

const stopBackend = async () => {
  if (!backendProcess) {
    return;
  }

  await new Promise<void>((resolve) => {
    backendProcess?.once("exit", () => resolve());
    backendProcess?.kill();
  });

  backendProcess = null;
};

const resetBackendState = async () => {
  await fetch(`${BASE_URL}/__testing__/reset`, {
    method: "POST",
  });
};

const failNextVisitCreation = async () => {
  await fetch(`${BASE_URL}/__testing__/fail-next-visit`, {
    method: "POST",
  });
};

const fetchRecordedVisits = async () => {
  const response = await fetch(`${BASE_URL}/__testing__/visits`);
  const data = (await response.json()) as { visits: Array<Record<string, unknown>> };
  return data.visits;
};

const triggerLastDateChange = (date: Date) => {
  const listeners = DateTimePickerMock.__listeners;
  const handler = listeners[listeners.length - 1];
  if (handler) {
    handler({}, date);
  }
};

const completeLogin = async (screen: RenderAPI) => {
  const emailInput = screen.getByPlaceholderText("Correo");
  const passwordInput = screen.getByPlaceholderText("Contraseña");

  fireEvent.changeText(emailInput, "admin@example.com");
  fireEvent.changeText(passwordInput, "admin123");

  await act(async () => {
    fireEvent.press(screen.getByText("Iniciar sesión"));
  });

  await waitFor(() => {
    expect(screen.getByText("Selecciona la entidad")).toBeTruthy();
  });
};

const openVisitForm = async (screen: RenderAPI) => {
  const visitasTab = screen.getAllByText("Visitas")[0];

  await act(async () => {
    fireEvent.press(visitasTab);
  });

  await waitFor(() => {
    expect(screen.getByText("Filtrar Cliente")).toBeTruthy();
  });

  await act(async () => {
    fireEvent.press(screen.getByText("Colegio Central"));
  });

  await waitFor(() => {
    expect(
      screen.getByText("No hay visitas programadas para este cliente"),
    ).toBeTruthy();
  });

  await act(async () => {
    fireEvent.press(screen.getByText("Registrar visita"));
  });

  await waitFor(() => {
    expect(screen.getByText("Nombre Institución *")).toBeTruthy();
  });
};

beforeAll(async () => {
  await startBackend();
});

afterAll(async () => {
  await stopBackend();
});

beforeEach(async () => {
  await resetBackendState();
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  DateTimePickerMock.__listeners.length = 0;
});

const fillVisitForm = (screen: RenderAPI) => {
  fireEvent.changeText(
    screen.getByPlaceholderText("Ingrese dirección"),
    "Av. Principal 123",
  );

  fireEvent.changeText(
    screen.getByPlaceholderText("Ingrese minutos de desplazamiento"),
    "25",
  );

  act(() => {
    fireEvent.press(screen.getByText("Seleccionar hora de salida"));
  });

  act(() => {
    triggerLastDateChange(new Date("2024-11-20T12:45:00.000Z"));
  });

  fireEvent.changeText(
    screen.getByPlaceholderText("Ingrese observaciones"),
    "Confirmar agenda con coordinación",
  );
};

describe("E2E - Registro de visita", () => {
  it("permite autenticar al asesor y registrar una visita exitosa", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const screen = render(<App />);

    await completeLogin(screen);
    await openVisitForm(screen);

    expect(screen.getByDisplayValue("Colegio Central")).toBeTruthy();

    fillVisitForm(screen);

    // Click the Guardar button to open modal
    await act(async () => {
      fireEvent.press(screen.getAllByText("Guardar")[0]);
    });

    // Click the Guardar button in the modal to confirm
    await act(async () => {
      const guardarButtons = screen.getAllByText("Guardar");
      fireEvent.press(guardarButtons[guardarButtons.length - 1]);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    const successCall = alertSpy.mock.calls.find(([title]) => title === "Éxito");
    expect(successCall).toBeDefined();

    const [, , buttons] = successCall!;
    await act(async () => {
      buttons?.[0].onPress?.();
    });

    await waitFor(() => {
      expect(
        screen.getByText("Listado de Visitas - Colegio Central"),
      ).toBeTruthy();
    });

    const visits = await fetchRecordedVisits();
    expect(visits).toHaveLength(1);

    const [visit] = visits;
    expect(visit).toMatchObject({
      nombre_institucion: "Colegio Central",
      direccion: "Av. Principal 123",
      estado: "Programada",
      desplazamiento_minutos: 25,
      observacion: "Confirmar agenda con coordinación",
    });

    expect(typeof visit.hora).toBe("string");
    const scheduledDate = new Date(String(visit.hora));
    expect(Number.isNaN(scheduledDate.getTime())).toBe(false);
    expect(new Date(String(visit.hora_salida)).toISOString()).toBe(
      "2024-11-20T12:45:00.000Z",
    );

    const tokenCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
      ([key]) => key === "auth_token",
    );
    expect(tokenCall?.[1]).toEqual(expect.any(String));

    const userCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
      ([key]) => key === "user_data",
    );
    expect(userCall).toBeDefined();
    const storedUser = JSON.parse(userCall![1] as string);
    expect(storedUser.user.email).toBe("admin@example.com");
    expect(Array.isArray(storedUser.permissions)).toBe(true);

    alertSpy.mockRestore();
  });

  it("notifica el error cuando la API rechaza el registro de la visita", async () => {
    await failNextVisitCreation();
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const screen = render(<App />);

    await completeLogin(screen);
    await openVisitForm(screen);

    fireEvent.changeText(
      screen.getByPlaceholderText("Ingrese dirección"),
      "Av. Principal 123",
    );

    // Click the Guardar button to open modal
    await act(async () => {
      fireEvent.press(screen.getAllByText("Guardar")[0]);
    });

    // Click the Guardar button in the modal to confirm
    await act(async () => {
      const guardarButtons = screen.getAllByText("Guardar");
      fireEvent.press(guardarButtons[guardarButtons.length - 1]);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "No se pudo crear la visita");
    });

    const visits = await fetchRecordedVisits();
    expect(visits).toHaveLength(0);

    expect(
      screen.getByPlaceholderText("Ingrese dirección").props.value,
    ).toBe("Av. Principal 123");

    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
