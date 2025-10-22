import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as DocumentPicker from "expo-document-picker";
import { RootStackParamList } from "../../../navigation/RootNavigator";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { InstitutionalClientCreate } from "../../../types/institutionalClient";

type InstitutionRegistrationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "InstitutionRegistration"
>;

export const InstitutionRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<InstitutionRegistrationScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form fields
  const [nombreInstitucion, setNombreInstitucion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [direccionInstitucional, setDireccionInstitucional] = useState("");
  const [identificacionTributaria, setIdentificacionTributaria] = useState("");
  const [representanteLegal, setRepresentanteLegal] = useState("");
  const [telefono, setTelefono] = useState("");
  const [justificacionAcceso, setJustificacionAcceso] = useState("");
  const [certificadoCamara, setCertificadoCamara] = useState<string | null>(null);
  const [certificadoCamaraName, setCertificadoCamaraName] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCertificadoCamaraName(file.name);
        // En una implementación real, aquí convertiríamos el archivo a base64
        // o lo subiríamos a un servidor. Por ahora, guardamos el URI.
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

  const handleShowConfirmModal = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigation.goBack();
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      const institutionData: InstitutionalClientCreate = {
        nombre_institucion: nombreInstitucion,
        direccion,
        direccion_institucional: direccionInstitucional,
        identificacion_tributaria: identificacionTributaria,
        representante_legal: representanteLegal,
        telefono,
        justificacion_acceso: justificacionAcceso || undefined,
        certificado_camara: certificadoCamara || undefined,
      };

      await institutionalClientService.createInstitutionalClient(institutionData);

      Alert.alert(
        "Éxito",
        "La institución ha sido registrada exitosamente",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error) {
      console.error("Error registering institution:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al registrar la institución";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.header}>
            <Text style={styles.title}>Registro Institución</Text>
          </View>
          <View style={styles.formContainer}>
            {/* Nombre Institución */}
            <View style={styles.field}>
              <Text style={styles.label}>Nombre Institución</Text>
              <TextInput
                style={[styles.input, errors.nombreInstitucion && styles.inputError]}
                placeholder="Nombre Institución"
                placeholderTextColor="#94a3b8"
                value={nombreInstitucion}
                onChangeText={setNombreInstitucion}
              />
              {errors.nombreInstitucion && (
                <Text style={styles.errorText}>{errors.nombreInstitucion}</Text>
              )}
            </View>

            {/* Dirección */}
            <View style={styles.field}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={[styles.input, errors.direccion && styles.inputError]}
                placeholder="Dirección"
                placeholderTextColor="#94a3b8"
                value={direccion}
                onChangeText={setDireccion}
              />
              {errors.direccion && (
                <Text style={styles.errorText}>{errors.direccion}</Text>
              )}
            </View>

            {/* Dirección Institucional (Email) */}
            <View style={styles.field}>
              <Text style={styles.label}>Dirección Institucional</Text>
              <TextInput
                style={[styles.input, errors.direccionInstitucional && styles.inputError]}
                placeholder="correo@institucion.com"
                placeholderTextColor="#94a3b8"
                value={direccionInstitucional}
                onChangeText={setDireccionInstitucional}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.direccionInstitucional && (
                <Text style={styles.errorText}>{errors.direccionInstitucional}</Text>
              )}
            </View>

            {/* Identificación Tributaria (NIT) */}
            <View style={styles.field}>
              <Text style={styles.label}>Identificación Tributaria</Text>
              <TextInput
                style={[styles.input, errors.identificacionTributaria && styles.inputError]}
                placeholder="NIT"
                placeholderTextColor="#94a3b8"
                value={identificacionTributaria}
                onChangeText={setIdentificacionTributaria}
              />
              {errors.identificacionTributaria && (
                <Text style={styles.errorText}>{errors.identificacionTributaria}</Text>
              )}
            </View>

            {/* Representante Legal */}
            <View style={styles.field}>
              <Text style={styles.label}>Representante Legal</Text>
              <TextInput
                style={[styles.input, errors.representanteLegal && styles.inputError]}
                placeholder="Representante Legal"
                placeholderTextColor="#94a3b8"
                value={representanteLegal}
                onChangeText={setRepresentanteLegal}
              />
              {errors.representanteLegal && (
                <Text style={styles.errorText}>{errors.representanteLegal}</Text>
              )}
            </View>

            {/* Teléfono */}
            <View style={styles.field}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, errors.telefono && styles.inputError]}
                placeholder="Teléfono"
                placeholderTextColor="#94a3b8"
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />
              {errors.telefono && (
                <Text style={styles.errorText}>{errors.telefono}</Text>
              )}
            </View>

            {/* Justificación de Acceso (Optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Justificación de Acceso (Opcional)</Text>
              <TextInput
                style={[styles.textarea]}
                placeholder="Justificación de acceso..."
                placeholderTextColor="#94a3b8"
                value={justificacionAcceso}
                onChangeText={setJustificacionAcceso}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Certificado de Cámara de Comercio */}
            <View style={styles.field}>
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
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelActionButton]}
                onPress={handleCancel}
              >
                <Text style={styles.actionButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.submitActionButton, isLoading && styles.buttonDisabled]}
                onPress={handleShowConfirmModal}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>
                  {isLoading ? "Registrando..." : "Registrar"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Espacio adicional al final para asegurar scroll completo */}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Registro</Text>
            <Text style={styles.modalText}>
              ¿Está seguro de que desea registrar esta institución?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSubmit}
              >
                <Text style={styles.modalButtonTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Registro</Text>
            <Text style={styles.modalText}>
              ¿Está seguro de que desea cancelar el registro? Se perderán todos los datos ingresados.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>No, continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.modalButtonTextConfirm}>Sí, cancelar</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  formContainer: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "transparent",
  },
  textarea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "transparent",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  fileButton: {
    height: 44,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0369A1",
  },
  fileButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  fileInfo: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelActionButton: {
    backgroundColor: "#0369A1",
  },
  submitActionButton: {
    backgroundColor: "#0369A1",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  bottomSpacer: {
    height: 100,
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
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalButtonConfirm: {
    backgroundColor: "#0369A1",
  },
  modalButtonTextCancel: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  modalButtonTextConfirm: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});
