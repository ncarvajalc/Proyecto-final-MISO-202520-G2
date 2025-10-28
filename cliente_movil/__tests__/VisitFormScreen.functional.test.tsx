import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { VisitFormScreen } from "../src/modules/visitas/screens/VisitFormScreen";
import { visitService } from "../src/services/visitService";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  __esModule: true,
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      clientId: "client-1",
      clientName: "Colegio Central",
    },
  }),
}));

jest.mock("../src/services/visitService", () => ({
  visitService: {
    createVisit: jest.fn(),
  },
}));

jest.mock("@react-native-community/datetimepicker", () => {
  return () => null;
});

const fixedNow = new Date("2024-11-20T10:00:00.000Z");

let alertSpy: jest.SpyInstance;

const mockCreateVisit = visitService.createVisit as jest.Mock;

describe("VisitFormScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    alertSpy.mockRestore();
  });

  it("muestra un mensaje cuando faltan campos obligatorios", async () => {
    const { getByText } = render(<VisitFormScreen />);

    fireEvent.press(getByText("Guardar Visita"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Error",
        "Por favor complete todos los campos requeridos"
      );
    });

    expect(mockCreateVisit).not.toHaveBeenCalled();
  });

  it("registra la visita y vuelve al listado cuando la API responde correctamente", async () => {
    mockCreateVisit.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<VisitFormScreen />);

    fireEvent.changeText(
      getByPlaceholderText("Ingrese dirección"),
      "Cra 45 #20-10"
    );

    fireEvent.press(getByText("Guardar Visita"));

    await waitFor(() => expect(mockCreateVisit).toHaveBeenCalledTimes(1));

    const expectedPayload = {
      nombre_institucion: "Colegio Central",
      direccion: "Cra 45 #20-10",
      hora: fixedNow.toISOString(),
      estado: "Programada",
    };

    expect(mockCreateVisit).toHaveBeenCalledWith(expectedPayload);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Éxito",
        "Visita creada correctamente",
        expect.any(Array)
      );
    });

    const successCall = alertSpy.mock.calls.find(
      ([title]) => title === "Éxito"
    );

    expect(successCall).toBeDefined();

    const [, , buttons] = successCall!;
    expect(buttons).toBeDefined();
    expect(buttons![0].text).toBe("OK");

    buttons![0].onPress?.();

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("notifica el error cuando la API falla al registrar la visita", async () => {
    mockCreateVisit.mockRejectedValue(new Error("500"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<VisitFormScreen />);

    fireEvent.changeText(
      getByPlaceholderText("Ingrese dirección"),
      "Cra 45 #20-10"
    );

    fireEvent.press(getByText("Guardar Visita"));

    await waitFor(() => expect(mockCreateVisit).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Error",
        "No se pudo crear la visita"
      );
    });

    expect(mockGoBack).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
