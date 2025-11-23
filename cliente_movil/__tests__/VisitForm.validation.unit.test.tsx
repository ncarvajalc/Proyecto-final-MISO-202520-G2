import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { VisitForm } from "../src/modules/visitas/components/VisitForm";
import { Alert } from "react-native";

jest.mock("../src/utils/multimediaUtils", () => ({
  takePhoto: jest.fn(),
  recordVideo: jest.fn(),
  pickImage: jest.fn(),
  pickVideo: jest.fn(),
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  const DateTimePickerMock = ({ value, onChange, testID }: any) => (
    <View
      testID={testID}
      value={value}
      onStartShouldSetResponder={() => true}
      onResponderRelease={() =>
        onChange?.(
          { nativeEvent: { timestamp: value?.getTime?.() } },
          value
        )
      }
    />
  );

  return {
    __esModule: true,
    default: DateTimePickerMock,
    DateTimePickerAndroid: {
      open: jest.fn(),
      dismissedAction: "dismissed",
    },
  };
});

describe("VisitForm - validación de hora final", () => {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra un error cuando la hora de salida es anterior a la hora inicial", async () => {
    jest.spyOn(Alert, "alert");
    const past = new Date("2024-05-01T11:00:00Z");

    const { getByText, getAllByText, getByTestId, getByPlaceholderText } = render(
      <VisitForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Ingrese nombre de la institución"),
      "Colegio Central"
    );
    fireEvent.changeText(
      getByPlaceholderText("Ingrese dirección"),
      "Av. Siempre Viva 123"
    );

    // Abrir el selector de hora de salida y asignar una hora anterior
    fireEvent.press(getByText("Seleccionar hora de salida"));
    fireEvent(getByTestId("visit-end-picker"), "onChange", {
      nativeEvent: { timestamp: past.getTime() },
    }, past);

    // Abrir el modal de guardado y confirmar
    fireEvent.press(getByText("Guardar"));
    const confirmButton = getAllByText("Guardar")[1];
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Hora de salida inválida",
        "La hora de salida debe ser posterior a la hora de inicio"
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("bloquea la misma hora de salida que la hora inicial", async () => {
    jest.spyOn(Alert, "alert");
    const startDate = new Date("2024-05-01T15:00:00Z");

    const { getByText, getAllByText, getByTestId, getByPlaceholderText } = render(
      <VisitForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Ingrese nombre de la institución"),
      "Colegio Central"
    );
    fireEvent.changeText(
      getByPlaceholderText("Ingrese dirección"),
      "Av. Siempre Viva 123"
    );

    // Open end time picker and set the same timestamp
    fireEvent.press(getByText("Seleccionar hora de salida"));
    fireEvent(getByTestId("visit-end-picker"), "onChange", {
      nativeEvent: { timestamp: startDate.getTime() },
    }, startDate);

    fireEvent.press(getByText("Guardar"));
    const confirmButton = getAllByText("Guardar")[1];
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Hora de salida inválida",
        "La hora de salida debe ser posterior a la hora de inicio"
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("muestra errores cuando los campos obligatorios están vacíos", async () => {
    jest.spyOn(Alert, "alert");

    const { getByText, getAllByText } = render(
      <VisitForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    fireEvent.press(getByText("Guardar"));
    const confirmButton = getAllByText("Guardar")[1];
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Campos obligatorios",
        "Nombre de institución y dirección son requeridos"
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("valida que el desplazamiento sea numérico y positivo", async () => {
    jest.spyOn(Alert, "alert");

    const { getByText, getByPlaceholderText, getAllByText } = render(
      <VisitForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Ingrese nombre de la institución"),
      "Colegio Central"
    );
    fireEvent.changeText(
      getByPlaceholderText("Ingrese dirección"),
      "Av. Siempre Viva 123"
    );
    fireEvent.changeText(
      getByPlaceholderText("Ingrese minutos de desplazamiento"),
      "-10"
    );

    fireEvent.press(getByText("Guardar"));
    const confirmButton = getAllByText("Guardar")[1];
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Desplazamiento inválido",
        "Ingresa un número de minutos válido"
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("usa la hora inicial como predeterminada al abrir el selector de hora final", async () => {
    const startDate = new Date("2024-05-01T18:00:00Z");
    const { getByText, getByTestId } = render(
      <VisitForm onSubmit={onSubmit} onCancel={onCancel} />
    );

    // Abrir selector de hora inicial y establecer la hora deseada
    fireEvent.press(getByTestId("visit-start-display"));
    fireEvent(
      getByTestId("visit-start-picker"),
      "onChange",
      { nativeEvent: { timestamp: startDate.getTime() } },
      startDate
    );

    fireEvent.press(getByText("Seleccionar hora de salida"));

    const picker = getByTestId("visit-end-picker");
    expect(picker.props.value).toEqual(startDate);
  });
});
