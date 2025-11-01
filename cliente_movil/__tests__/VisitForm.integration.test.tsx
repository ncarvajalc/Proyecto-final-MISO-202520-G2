import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { VisitForm } from "../src/modules/visitas/components/VisitForm";
import { VisitCreate } from "../src/types/visit";

const fixedNow = new Date("2024-11-20T10:00:00.000Z");
const mockSelectedExitDate = new Date("2024-11-20T12:45:00.000Z");

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");

  return ({ onChange }: { onChange: (event: unknown, date?: Date) => void }) => {
    const notifiedRef = React.useRef(false);

    React.useEffect(() => {
      if (!notifiedRef.current) {
        notifiedRef.current = true;
        onChange({}, mockSelectedExitDate);
      }
    }, [onChange]);

    return null;
  };
});

describe("VisitForm", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("construye el payload de la visita con los datos capturados del formulario", () => {
    const onSubmit = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <VisitForm onSubmit={onSubmit} onCancel={jest.fn()} initialClientName="Cliente Demo" />
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
      "45"
    );
    fireEvent.press(getByText("Seleccionar hora de salida"));
    fireEvent.changeText(
      getByPlaceholderText("Ingrese observaciones"),
      "Confirmar asistencia"
    );

    // Click the Guardar button to open modal
    fireEvent.press(getByText("Guardar"));

    // Confirm in the modal
    const confirmButtons = getByText("Guardar", { exact: false });
    fireEvent.press(confirmButtons);

    const expectedPayload: VisitCreate = {
      nombre_institucion: "Colegio Central",
      direccion: "Av. Siempre Viva 123",
      hora: fixedNow.toISOString(),
      estado: "Programada",
      desplazamiento_minutos: 45,
      hora_salida: mockSelectedExitDate.toISOString(),
      observacion: "Confirmar asistencia",
    };

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expectedPayload);
  });
});
