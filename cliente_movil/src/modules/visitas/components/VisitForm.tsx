import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { VisitCreate } from "../../../types/visit";

interface VisitFormProps {
  onSubmit: (visit: VisitCreate) => void;
  onCancel: () => void;
  initialClientName?: string;
}

export const VisitForm: React.FC<VisitFormProps> = ({ onSubmit, onCancel, initialClientName }) => {
  const [nombreInstitucion, setNombreInstitucion] = useState(initialClientName || "");
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

  const estadoOptions = ["Programada", "En progreso", "Realizada", "Cancelada"];

  const handleSavePress = () => {
    setShowSaveModal(true);
  };

  const handleCancelPress = () => {
    setShowCancelModal(true);
  };

  const handleConfirmSave = () => {
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

    onSubmit(visit);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancel();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
          >
            <Text style={styles.dateText}>{hora.toLocaleString("es-ES")}</Text>
          </TouchableOpacity>
          {showHoraPicker && (
            <DateTimePicker
              value={hora}
              mode="datetime"
              display="default"
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
          >
            <Text style={[styles.dateText, !horaSalida && styles.placeholderText]}>
              {horaSalida ? horaSalida.toLocaleString("es-ES") : "Seleccionar hora de salida"}
            </Text>
          </TouchableOpacity>
          {showHoraSalidaPicker && (
            <DateTimePicker
              value={horaSalida || new Date()}
              mode="datetime"
              display="default"
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

          <TouchableOpacity style={styles.multimediaButton}>
            <Text style={styles.multimediaButtonText}>Agregar Multimedia</Text>
          </TouchableOpacity>

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
              Al Guardar, la información registrada será registrada en la base de datos de lo contrario regresara la pantalla anterior.
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
              Al Cancelar, se regresara listado de visitas de la institución, de lo contrario regresara la pantalla anterior.
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
});
