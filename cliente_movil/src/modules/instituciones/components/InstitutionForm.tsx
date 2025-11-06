import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InstitutionalClientCreate } from "../../../types/institutionalClient";

interface InstitutionFormProps {
  onSubmit: (institution: InstitutionalClientCreate) => void;
  onCancel: () => void;
}
export const InstitutionForm: React.FC<InstitutionFormProps> = ({ onSubmit, onCancel }) => {
  const [nombreInstitucion, setNombreInstitucion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [direccionInstitucional, setDireccionInstitucional] = useState("");
  const [identificacionTributaria, setIdentificacionTributaria] = useState("");
  const [representanteLegal, setRepresentanteLegal] = useState("");
  const [telefono, setTelefono] = useState("");
  const [justificacionAcceso, setJustificacionAcceso] = useState("");
  const [certificadoCamara, setCertificadoCamara] = useState<string | null>(null);
  const [certificadoCamaraName, setCertificadoCamaraName] = useState<string | null>(null);
  const [territoryId, setTerritoryId] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const insets = useSafeAreaInsets();

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCertificadoCamaraName(file.name);
        setCertificadoCamara(file.uri);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!nombreInstitucion.trim()) {
      newErrors.nombreInstitucion = "El nombre de la institución es requerido";
    }
    if (!direccion.trim()) {
      newErrors.direccion = "La dirección es requerida";
    }
    if (!direccionInstitucional.trim()) {
      newErrors.direccionInstitucional = "El correo institucional es requerido";
    } else if (!/\S+@\S+\.\S+/.test(direccionInstitucional)) {
      newErrors.direccionInstitucional = "Ingrese un correo válido";
    }
    if (!identificacionTributaria.trim()) {
      newErrors.identificacionTributaria = "La identificación tributaria es requerida";
    }
    if (!representanteLegal.trim()) {
      newErrors.representanteLegal = "El representante legal es requerido";
    }
    if (!telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePress = () => {
    if (validateForm()) {
      setShowSaveModal(true);
    }
  };

  const handleCancelPress = () => {
    setShowCancelModal(true);
  };

  const handleConfirmSave = () => {
    setShowSaveModal(false);
    const institutionData: InstitutionalClientCreate = {
      nombre_institucion: nombreInstitucion,
      direccion,
      direccion_institucional: direccionInstitucional,
      identificacion_tributaria: identificacionTributaria,
      representante_legal: representanteLegal,
      telefono,
      justificacion_acceso: justificacionAcceso || undefined,
      certificado_camara: certificadoCamara || undefined,
      territory_id: territoryId || undefined,
    };

    onSubmit(institutionData);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancel();
  };

  return (
    <React.Fragment>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: styles.scrollContent.paddingBottom + insets.bottom }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Nombre Institución */}
          <Text style={styles.label}>Nombre Institución</Text>
          <TextInput
            style={[styles.input, errors.nombreInstitucion && styles.inputError]}
            placeholder="Nombre Institución"
            placeholderTextColor="#cbd5e1"
            value={nombreInstitucion}
            onChangeText={setNombreInstitucion}
          />
          {errors.nombreInstitucion && (
            <Text style={styles.errorText}>{errors.nombreInstitucion}</Text>
          )}

          {/* Dirección */}
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, errors.direccion && styles.inputError]}
            placeholder="Dirección"
            placeholderTextColor="#cbd5e1"
            value={direccion}
            onChangeText={setDireccion}
          />
          {errors.direccion && (
            <Text style={styles.errorText}>{errors.direccion}</Text>
          )}

          {/* Dirección Institucional (Email) */}
          <Text style={styles.label}>Dirección Institucional</Text>
          <TextInput
            style={[styles.input, errors.direccionInstitucional && styles.inputError]}
            placeholder="correo@institucion.com"
            placeholderTextColor="#cbd5e1"
            value={direccionInstitucional}
            onChangeText={setDireccionInstitucional}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.direccionInstitucional && (
            <Text style={styles.errorText}>{errors.direccionInstitucional}</Text>
          )}

          {/* Identificación Tributaria (NIT) */}
          <Text style={styles.label}>Identificación Tributaria</Text>
          <TextInput
            style={[styles.input, errors.identificacionTributaria && styles.inputError]}
            placeholder="NIT"
            placeholderTextColor="#cbd5e1"
            value={identificacionTributaria}
            onChangeText={setIdentificacionTributaria}
          />
          {errors.identificacionTributaria && (
            <Text style={styles.errorText}>{errors.identificacionTributaria}</Text>
          )}

          {/* Representante Legal */}
          <Text style={styles.label}>Representante Legal</Text>
          <TextInput
            style={[styles.input, errors.representanteLegal && styles.inputError]}
            placeholder="Representante Legal"
            placeholderTextColor="#cbd5e1"
            value={representanteLegal}
            onChangeText={setRepresentanteLegal}
          />
          {errors.representanteLegal && (
            <Text style={styles.errorText}>{errors.representanteLegal}</Text>
          )}

          {/* Teléfono */}
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={[styles.input, errors.telefono && styles.inputError]}
            placeholder="Teléfono"
            placeholderTextColor="#cbd5e1"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
          {errors.telefono && (
            <Text style={styles.errorText}>{errors.telefono}</Text>
          )}

          {/* Justificación de Acceso (Optional) */}
          <Text style={styles.label}>Justificación de Acceso</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Justificación de acceso..."
            placeholderTextColor="#cbd5e1"
            value={justificacionAcceso}
            onChangeText={setJustificacionAcceso}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Ciudad */}
          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ciudad"
            placeholderTextColor="#cbd5e1"
            value={territoryId}
            onChangeText={setTerritoryId}
          />

          {/* Certificado de Cámara de Comercio */}
          <TouchableOpacity
            style={styles.fileButton}
            onPress={handlePickDocument}
          >
            <Text style={styles.fileButtonText}>
              Certificado de Cámara de Comercio
            </Text>
          </TouchableOpacity>
          {certificadoCamaraName && (
            <Text style={styles.fileInfo}>Archivo: {certificadoCamaraName}</Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSavePress}
            >
              <Text style={styles.actionButtonText}>Registrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelPress}
            >
              <Text style={styles.actionButtonText}>Cancelar</Text>
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
              Al Cancelar, se regresara a la pantalla anterior y se perderán todos los datos ingresados.
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
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflow: "visible",
      }
    }),
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
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  fileButton: {
    backgroundColor: "#024A77",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 24,
  },
  fileButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  fileInfo: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
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
