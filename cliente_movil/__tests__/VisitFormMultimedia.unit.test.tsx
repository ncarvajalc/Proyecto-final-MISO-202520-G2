import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { VisitForm } from "../src/modules/visitas/components/VisitForm";
import { MultimediaFile } from "../src/types/visit";
import * as multimediaUtils from "../src/utils/multimediaUtils";

// Mock multimedia utilities
jest.mock("../src/utils/multimediaUtils", () => ({
  takePhoto: jest.fn(),
  recordVideo: jest.fn(),
  pickImage: jest.fn(),
  pickVideo: jest.fn(),
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  return ({ onChange }: { onChange: (event: unknown, date?: Date) => void }) => {
    const notifiedRef = React.useRef(false);
    React.useEffect(() => {
      if (!notifiedRef.current) {
        notifiedRef.current = true;
        onChange({}, new Date("2024-11-20T10:00:00.000Z"));
      }
    }, [onChange]);
    return null;
  };
});

describe("VisitForm - Multimedia Upload", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el botón de agregar multimedia", () => {
    const { getByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(getByText(/Agregar Multimedia/i)).toBeTruthy();
  });

  it("abre el modal de multimedia al presionar el botón", () => {
    const { getByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByText(/Agregar Multimedia/i));

    expect(getByText("Seleccionar Multimedia")).toBeTruthy();
    expect(getByText("Tomar Foto")).toBeTruthy();
    expect(getByText("Grabar Video")).toBeTruthy();
    expect(getByText("Elegir Foto")).toBeTruthy();
    expect(getByText("Elegir Video")).toBeTruthy();
  });

  it("adjunta foto al formulario cuando se toma una foto", async () => {
    const mockPhoto: MultimediaFile = {
      uri: "file:///path/to/photo.jpg",
      name: "photo_123.jpg",
      type: "image/jpeg",
    };

    (multimediaUtils.takePhoto as jest.Mock).mockResolvedValue(mockPhoto);

    const { getByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Open multimedia modal
    fireEvent.press(getByText(/Agregar Multimedia/i));

    // Select take photo
    fireEvent.press(getByText("Tomar Foto"));

    await waitFor(() => {
      expect(multimediaUtils.takePhoto).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(getByText("photo_123.jpg")).toBeTruthy();
      expect(getByText("image/jpeg")).toBeTruthy();
    });
  });

  it("adjunta video al formulario cuando se graba un video", async () => {
    const mockVideo: MultimediaFile = {
      uri: "file:///path/to/video.mp4",
      name: "video_456.mp4",
      type: "video/mp4",
    };

    (multimediaUtils.recordVideo as jest.Mock).mockResolvedValue(mockVideo);

    const { getByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Grabar Video"));

    await waitFor(() => {
      expect(multimediaUtils.recordVideo).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(getByText("video_456.mp4")).toBeTruthy();
      expect(getByText("video/mp4")).toBeTruthy();
    });
  });

  it("adjunta imagen desde galería", async () => {
    const mockImage: MultimediaFile = {
      uri: "file:///gallery/image.jpg",
      name: "gallery_image.jpg",
      type: "image/jpeg",
    };

    (multimediaUtils.pickImage as jest.Mock).mockResolvedValue(mockImage);

    const { getByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Elegir Foto"));

    await waitFor(() => {
      expect(multimediaUtils.pickImage).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(getByText("gallery_image.jpg")).toBeTruthy();
    });
  });

  it("adjunta múltiples archivos al formulario", async () => {
    const mockPhoto: MultimediaFile = {
      uri: "file:///photo1.jpg",
      name: "photo1.jpg",
      type: "image/jpeg",
    };

    const mockVideo: MultimediaFile = {
      uri: "file:///video1.mp4",
      name: "video1.mp4",
      type: "video/mp4",
    };

    (multimediaUtils.takePhoto as jest.Mock).mockResolvedValue(mockPhoto);
    (multimediaUtils.recordVideo as jest.Mock).mockResolvedValue(mockVideo);

    const { getByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Add photo
    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Tomar Foto"));

    await waitFor(() => {
      expect(getByText("photo1.jpg")).toBeTruthy();
    });

    // Add video
    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Grabar Video"));

    await waitFor(() => {
      expect(getByText("photo1.jpg")).toBeTruthy();
      expect(getByText("video1.mp4")).toBeTruthy();
    });
  });

  it("muestra el contador de archivos en el botón", async () => {
    const mockPhoto: MultimediaFile = {
      uri: "file:///photo.jpg",
      name: "photo.jpg",
      type: "image/jpeg",
    };

    (multimediaUtils.takePhoto as jest.Mock).mockResolvedValue(mockPhoto);

    const { getByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Tomar Foto"));

    await waitFor(() => {
      expect(getByText(/Agregar Multimedia \(1\)/i)).toBeTruthy();
    });
  });

  it("permite eliminar archivos adjuntos", async () => {
    const mockPhoto: MultimediaFile = {
      uri: "file:///photo.jpg",
      name: "photo.jpg",
      type: "image/jpeg",
    };

    // Mock Alert.alert to automatically confirm deletion
    jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(
      (title, message, buttons) => {
        if (buttons && buttons.length > 0) {
          // Find and call the onPress of the "Eliminar" button
          const deleteButton = buttons.find((btn: any) => btn.text === 'Eliminar');
          if (deleteButton && deleteButton.onPress) {
            deleteButton.onPress();
          }
        }
      }
    );

    (multimediaUtils.takePhoto as jest.Mock).mockResolvedValue(mockPhoto);

    const { getByText, queryByText, getAllByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Add photo
    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Tomar Foto"));

    await waitFor(() => {
      expect(getByText("photo.jpg")).toBeTruthy();
    });

    // Find and press remove button (✕)
    const removeButtons = getAllByText("✕");
    fireEvent.press(removeButtons[0]);

    // Verify file was removed after alert confirmation
    await waitFor(() => {
      expect(queryByText("photo.jpg")).toBeNull();
    });
  });

  it("incluye archivos multimedia en el payload al enviar el formulario", async () => {
    const mockPhoto: MultimediaFile = {
      uri: "file:///photo.jpg",
      name: "photo.jpg",
      type: "image/jpeg",
    };

    const mockVideo: MultimediaFile = {
      uri: "file:///video.mp4",
      name: "video.mp4",
      type: "video/mp4",
    };

    (multimediaUtils.takePhoto as jest.Mock).mockResolvedValue(mockPhoto);
    (multimediaUtils.recordVideo as jest.Mock).mockResolvedValue(mockVideo);

    const { getByText, getByPlaceholderText, getAllByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Fill form
    fireEvent.changeText(
      getByPlaceholderText("Ingrese nombre de la institución"),
      "Hospital Central"
    );
    fireEvent.changeText(
      getByPlaceholderText("Ingrese dirección"),
      "Av. Principal 123"
    );

    // Add photo
    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Tomar Foto"));

    await waitFor(() => {
      expect(getByText("photo.jpg")).toBeTruthy();
    });

    // Add video
    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Grabar Video"));

    await waitFor(() => {
      expect(getByText("video.mp4")).toBeTruthy();
    });

    // Submit form - press the save button to open modal
    fireEvent.press(getByText("Guardar"));

    // Wait for modal to appear and press confirm
    await waitFor(() => {
      expect(getByText("Guardar registro?")).toBeTruthy();
    });

    // Now press the Guardar button in the modal
    const saveButtons = getAllByText("Guardar");
    fireEvent.press(saveButtons[saveButtons.length - 1]); // Press the last Guardar button (in modal)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    // Verify payload includes files
    const submitPayload = mockOnSubmit.mock.calls[0][0];
    expect(submitPayload.files).toBeDefined();
    expect(submitPayload.files).toHaveLength(2);
    expect(submitPayload.files[0]).toEqual(mockPhoto);
    expect(submitPayload.files[1]).toEqual(mockVideo);
  });

  it("no incluye campo files si no hay archivos adjuntos", async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Fill only required fields
    fireEvent.changeText(
      getByPlaceholderText("Ingrese nombre de la institución"),
      "Hospital Central"
    );
    fireEvent.changeText(
      getByPlaceholderText("Ingrese dirección"),
      "Av. Principal 123"
    );

    // Submit without files - press the save button to open modal
    fireEvent.press(getByText("Guardar"));

    // Wait for modal to appear
    await waitFor(() => {
      expect(getByText("Guardar registro?")).toBeTruthy();
    });

    // Press the Guardar button in the modal
    const saveButtons = getAllByText("Guardar");
    fireEvent.press(saveButtons[saveButtons.length - 1]);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const submitPayload = mockOnSubmit.mock.calls[0][0];
    expect(submitPayload.files).toBeUndefined();
  });

  it("maneja correctamente cuando no se selecciona archivo (cancelación)", async () => {
    (multimediaUtils.takePhoto as jest.Mock).mockResolvedValue(null);

    const { getByText, queryByText } = render(
      <VisitForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByText(/Agregar Multimedia/i));
    fireEvent.press(getByText("Tomar Foto"));

    await waitFor(() => {
      expect(multimediaUtils.takePhoto).toHaveBeenCalledTimes(1);
    });

    // Should not show any file
    expect(queryByText("Archivos seleccionados:")).toBeNull();
    expect(getByText(/Agregar Multimedia/i)).toBeTruthy(); // No counter
  });
});
