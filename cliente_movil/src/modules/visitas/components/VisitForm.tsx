import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { VisitCreate, MultimediaFile } from "../../../types/visit";
import {
  takePhoto,
  recordVideo,
  pickImage,
  pickVideo,
} from "../../../utils/multimediaUtils";

interface VisitFormProps {
  onSubmit: (visit: VisitCreate) => void;
  onCancel: () => void;
  initialClientName?: string;
}

export const VisitForm: React.FC<VisitFormProps> = ({
  onSubmit,
  onCancel,
  initialClientName,
}) => {
  const [nombreInstitucion, setNombreInstitucion] = useState(
    initialClientName || ""
  );
  const [direccion, setDireccion] = useState("");
  const [hora, setHora] = useState(new Date());
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [desplazamientoMinutos, setDesplazamientoMinutos] = useState("");
  const [horaSalida, setHoraSalida] = useState<Date | null>(null);
  const [showHoraSalidaPicker, setShowHoraSalidaPicker] = useState(false);
  const [estado, setEstado] = useState("Programada");
  const [observacion, setObservacion] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [multimediaFiles, setMultimediaFiles] = useState<MultimediaFile[]>([]);
  const [showMultimediaModal, setShowMultimediaModal] = useState(false);

  const estadoOptions = ["Programada", "En progreso", "Realizada", "Cancelada"];

  const handleSavePress = () => {
    setShowSaveModal(true);
  };

  const handleCancelPress = () => {
    setShowCancelModal(true);
  };

  const handleConfirmSave = () => {
    if (!nombreInstitucion.trim() || !direccion.trim()) {
      Alert.alert(
        "Campos obligatorios",
        "Nombre de institución y dirección son requeridos"
      );
      setShowSaveModal(false);
      return;
    }

    if (
      desplazamientoMinutos &&
      (Number.isNaN(Number(desplazamientoMinutos)) ||
        Number(desplazamientoMinutos) < 0)
    ) {
      Alert.alert(
        "Desplazamiento inválido",
        "Ingresa un número de minutos válido"
      );
      setShowSaveModal(false);
      return;
    }

    if (horaSalida && horaSalida <= hora) {
      Alert.alert(
        "Hora de salida inválida",
        "La hora de salida debe ser posterior a la hora de inicio"
      );
      setShowSaveModal(false);
      return;
    }

    setShowSaveModal(false);
    const visit: VisitCreate = {
      nombre_institucion: nombreInstitucion,
      direccion: direccion,
      hora: hora.toISOString(),
      estado: estado,
    };

    if (desplazamientoMinutos) {
      visit.desplazamiento_minutos = parseInt(desplazamientoMinutos);
    }

    if (horaSalida) {
      visit.hora_salida = horaSalida.toISOString();
    }

    if (observacion) {
      visit.observacion = observacion;
    }

    if (multimediaFiles.length > 0) {
      visit.files = multimediaFiles;
    }

    onSubmit(visit);
  };

  const handleAddMultimedia = () => {
    setShowMultimediaModal(true);
  };

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo) {
      setMultimediaFiles([...multimediaFiles, photo]);
      setShowMultimediaModal(false);
    }
  };

  const handleRecordVideo = async () => {
    const video = await recordVideo();
    if (video) {
      setMultimediaFiles([...multimediaFiles, video]);
      setShowMultimediaModal(false);
    }
  };

  const handlePickImage = async () => {
    const image = await pickImage();
    if (image) {
      setMultimediaFiles([...multimediaFiles, image]);
      setShowMultimediaModal(false);
    }
  };

  const handlePickVideo = async () => {
    const video = await pickVideo();
    if (video) {
      setMultimediaFiles([...multimediaFiles, video]);
      setShowMultimediaModal(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    Alert.alert("Eliminar archivo", "¿Está seguro de eliminar este archivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          const newFiles = multimediaFiles.filter((_, i) => i !== index);
          setMultimediaFiles(newFiles);
        },
      },
    ]);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancel();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.form}>
          <Text style={styles.label}>Nombre Institución *</Text>
          <TextInput
            style={styles.input}
            value={nombreInstitucion}
            onChangeText={setNombreInstitucion}
            placeholder="Ingrese nombre de la institución"
            placeholderTextColor="#cbd5e1"
          />

          <Text style={styles.label}>Dirección *</Text>
          <TextInput
            style={styles.input}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ingrese dirección"
            placeholderTextColor="#cbd5e1"
          />

          <Text style={styles.label}>Hora *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowHoraPicker(true)}
            testID="visit-start-display"
          >
            <Text style={styles.dateText}>{hora.toLocaleString("es-ES")}</Text>
          </TouchableOpacity>
          {showHoraPicker && (
            <DateTimePicker
              value={hora}
              mode="datetime"
              display="default"
              testID="visit-start-picker"
              onChange={(event, selectedDate) => {
                setShowHoraPicker(Platform.OS === "ios");
                if (selectedDate) setHora(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Desplazamiento (minutos)</Text>
          <TextInput
            style={styles.input}
            value={desplazamientoMinutos}
            onChangeText={setDesplazamientoMinutos}
            placeholder="Ingrese minutos de desplazamiento"
            placeholderTextColor="#cbd5e1"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Hora Salida</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowHoraSalidaPicker(true)}
            testID="visit-end-display"
          >
            <Text
              style={[styles.dateText, !horaSalida && styles.placeholderText]}
            >
              {horaSalida
                ? horaSalida.toLocaleString("es-ES")
                : "Seleccionar hora de salida"}
            </Text>
          </TouchableOpacity>
          {showHoraSalidaPicker && (
            <DateTimePicker
              value={horaSalida || hora}
              mode="datetime"
              display="default"
              testID="visit-end-picker"
              onChange={(event, selectedDate) => {
                setShowHoraSalidaPicker(Platform.OS === "ios");
                if (selectedDate) setHoraSalida(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Estado</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={estado}
              onValueChange={(itemValue) => setEstado(itemValue)}
              style={styles.picker}
            >
              {estadoOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Observación de la visita</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observacion}
            onChangeText={setObservacion}
            placeholder="Ingrese observaciones"
            placeholderTextColor="#cbd5e1"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.multimediaButton}
            onPress={handleAddMultimedia}
          >
            <Text style={styles.multimediaButtonText}>
              Agregar Multimedia{" "}
              {multimediaFiles.length > 0 && `(${multimediaFiles.length})`}
            </Text>
          </TouchableOpacity>

          {/* Display selected multimedia files */}
          {multimediaFiles.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={styles.filesTitle}>Archivos seleccionados:</Text>
              {multimediaFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  {file.type.startsWith("image/") && (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.fileThumbnail}
                    />
                  )}
                  {file.type.startsWith("video/") && (
                    <View style={styles.videoThumbnail}>
                      <Text style={styles.videoIcon}>🎥</Text>
                    </View>
                  )}
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileType}>{file.type}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFile(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelPress}
            >
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSavePress}
            >
              <Text style={styles.actionButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmación de guardado */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Guardar registro?</Text>
            <Text style={styles.modalText}>
              Al Guardar, la información registrada será registrada en la base
              de datos de lo contrario regresara la pantalla anterior.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleConfirmSave}
              >
                <Text style={styles.modalButtonTextPrimary}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de cancelación */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Guardado?</Text>
            <Text style={styles.modalText}>
              Al Cancelar, se regresara listado de visitas de la institución, de
              lo contrario regresara la pantalla anterior.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.modalButtonTextPrimary}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Multimedia selection modal */}
      <Modal
        visible={showMultimediaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMultimediaModal(false)}
      >
        <View style={styles.multimediaModalOverlay}>
          <View style={styles.multimediaModalContent}>
            <Text style={styles.modalTitle}>Seleccionar Multimedia</Text>
            <Text style={styles.modalSubtitle}>
              Fotos: Comprimidas a 50% calidad{"\n"}
              Videos: Máximo 10 segundos
            </Text>

            <TouchableOpacity
              style={styles.multimediaOption}
              onPress={handleTakePhoto}
            >
              <Text style={styles.multimediaOptionIcon}>📸</Text>
              <View style={styles.multimediaOptionText}>
                <Text style={styles.multimediaOptionTitle}>Tomar Foto</Text>
                <Text style={styles.multimediaOptionSubtitle}>
                  Usar cámara para foto
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.multimediaOption}
              onPress={handleRecordVideo}
            >
              <Text style={styles.multimediaOptionIcon}>🎥</Text>
              <View style={styles.multimediaOptionText}>
                <Text style={styles.multimediaOptionTitle}>Grabar Video</Text>
                <Text style={styles.multimediaOptionSubtitle}>
                  Grabar video (max 10s)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.multimediaOption}
              onPress={handlePickImage}
            >
              <Text style={styles.multimediaOptionIcon}>🖼️</Text>
              <View style={styles.multimediaOptionText}>
                <Text style={styles.multimediaOptionTitle}>Elegir Foto</Text>
                <Text style={styles.multimediaOptionSubtitle}>
                  Desde galería
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.multimediaOption}
              onPress={handlePickVideo}
            >
              <Text style={styles.multimediaOptionIcon}>📹</Text>
              <View style={styles.multimediaOptionText}>
                <Text style={styles.multimediaOptionTitle}>Elegir Video</Text>
                <Text style={styles.multimediaOptionSubtitle}>
                  Desde galería (max 10s)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonSecondary,
                { marginTop: 16 },
              ]}
              onPress={() => setShowMultimediaModal(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    minHeight: 40,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#0f172a",
  },
  placeholderText: {
    color: "#cbd5e1",
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  multimediaButton: {
    backgroundColor: "#024A77",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 24,
  },
  multimediaButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#024A77",
  },
  saveButton: {
    backgroundColor: "#024A77",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalButtonPrimary: {
    backgroundColor: "#024A77",
  },
  modalButtonTextSecondary: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  modalButtonTextPrimary: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  // Multimedia styles
  filesContainer: {
    marginTop: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  fileThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  videoThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: "#64748b",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#dc2626",
    fontSize: 18,
    fontWeight: "600",
  },
  multimediaModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  multimediaModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },
  multimediaOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  multimediaOptionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  multimediaOptionText: {
    flex: 1,
  },
  multimediaOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  multimediaOptionSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
});
