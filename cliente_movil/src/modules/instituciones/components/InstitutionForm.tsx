import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InstitutionalClientCreate } from "../../../types/institutionalClient";
import { territoriesService, Territory } from "../../../services/territoriesService";

interface FormContentProps {
  nombreInstitucion: string;
  setNombreInstitucion: (value: string) => void;
  direccion: string;
  setDireccion: (value: string) => void;
  direccionInstitucional: string;
  setDireccionInstitucional: (value: string) => void;
  identificacionTributaria: string;
  setIdentificacionTributaria: (value: string) => void;
  representanteLegal: string;
  setRepresentanteLegal: (value: string) => void;
  telefono: string;
  setTelefono: (value: string) => void;
  justificacionAcceso: string;
  setJustificacionAcceso: (value: string) => void;
  territoryId: string;
  setTerritoryId: (value: string) => void;
  errors: {[key: string]: string};
  certificadoCamaraName: string | null;
  handlePickDocument: () => void;
  handleSavePress: () => void;
  handleCancelPress: () => void;
  countries: Territory[];
  states: Territory[];
  cities: Territory[];
  selectedCountry: string;
  selectedState: string;
  selectedCity: string;
  setSelectedCountry: (value: string) => void;
  setSelectedState: (value: string) => void;
  setSelectedCity: (value: string) => void;
  loadingTerritories: boolean;
}

const FormContent: React.FC<FormContentProps> = ({
  nombreInstitucion,
  setNombreInstitucion,
  direccion,
  setDireccion,
  direccionInstitucional,
  setDireccionInstitucional,
  identificacionTributaria,
  setIdentificacionTributaria,
  representanteLegal,
  setRepresentanteLegal,
  telefono,
  setTelefono,
  justificacionAcceso,
  setJustificacionAcceso,
  errors,
  certificadoCamaraName,
  handlePickDocument,
  handleSavePress,
  handleCancelPress,
  countries,
  states,
  cities,
  selectedCountry,
  selectedState,
  selectedCity,
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  loadingTerritories
}) => (
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

    {/* País */}
    <Text style={styles.label}>País</Text>
    {loadingTerritories ? (
      <ActivityIndicator color="#024A77" />
    ) : (
      <Picker
        selectedValue={selectedCountry}
        onValueChange={setSelectedCountry}
        style={styles.picker}
      >
        <Picker.Item label="Seleccione un país" value="" />
        {countries.map(country => (
          <Picker.Item key={country.id} label={country.name} value={country.id} />
        ))}
      </Picker>
    )}

    {/* Estado/Departamento */}
    {selectedCountry && (
      <>
        <Text style={styles.label}>Estado/Departamento</Text>
        {loadingTerritories ? (
          <ActivityIndicator color="#024A77" />
        ) : (
          <Picker
            selectedValue={selectedState}
            onValueChange={setSelectedState}
            style={styles.picker}
          >
            <Picker.Item label="Seleccione un estado" value="" />
            {states.map(state => (
              <Picker.Item key={state.id} label={state.name} value={state.id} />
            ))}
          </Picker>
        )}
      </>
    )}

    {/* Ciudad */}
    {selectedState && (
      <>
        <Text style={styles.label}>Ciudad</Text>
        {loadingTerritories ? (
          <ActivityIndicator color="#024A77" />
        ) : (
          <Picker
            selectedValue={selectedCity}
            onValueChange={setSelectedCity}
            style={styles.picker}
          >
            <Picker.Item label="Seleccione una ciudad" value="" />
            {cities.map(city => (
              <Picker.Item key={city.id} label={city.name} value={city.id} />
            ))}
          </Picker>
        )}
      </>
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
);

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

  // Estados para territorios
  const [countries, setCountries] = useState<Territory[]>([]);
  const [states, setStates] = useState<Territory[]>([]);
  const [cities, setCities] = useState<Territory[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loadingTerritories, setLoadingTerritories] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingTerritories(true);
      try {
        const data = await territoriesService.getCountries();
        setCountries(data);
      } catch (error) {
        console.error("Error fetching countries:", error);
        Alert.alert("Error", "No se pudieron cargar los países");
      } finally {
        setLoadingTerritories(false);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      if (selectedCountry) {
        setLoadingTerritories(true);
        try {
          const data = await territoriesService.getStates(selectedCountry);
          setStates(data);
          setSelectedState("");
          setCities([]);
          setSelectedCity("");
        } catch (error) {
          console.error("Error fetching states:", error);
          Alert.alert("Error", "No se pudieron cargar los estados");
        } finally {
          setLoadingTerritories(false);
        }
      } else {
        setStates([]);
      }
    };
    fetchStates();
  }, [selectedCountry]);

  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState) {
        setLoadingTerritories(true);
        try {
          const data = await territoriesService.getCities(selectedState);
          setCities(data);
          setSelectedCity("");
        } catch (error) {
          console.error("Error fetching cities:", error);
          Alert.alert("Error", "No se pudieron cargar las ciudades");
        } finally {
          setLoadingTerritories(false);
        }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [selectedState]);

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
    if (!selectedCity) {
      newErrors.city = "La ciudad es requerida";
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
      territory_id: selectedCity || undefined,
    };
    onSubmit(institutionData);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancel();
  };

  const renderFormContent = () => (
    <FormContent
      nombreInstitucion={nombreInstitucion}
      setNombreInstitucion={setNombreInstitucion}
      direccion={direccion}
      setDireccion={setDireccion}
      direccionInstitucional={direccionInstitucional}
      setDireccionInstitucional={setDireccionInstitucional}
      identificacionTributaria={identificacionTributaria}
      setIdentificacionTributaria={setIdentificacionTributaria}
      representanteLegal={representanteLegal}
      setRepresentanteLegal={setRepresentanteLegal}
      telefono={telefono}
      setTelefono={setTelefono}
      justificacionAcceso={justificacionAcceso}
      setJustificacionAcceso={setJustificacionAcceso}
      territoryId={territoryId}
      setTerritoryId={setTerritoryId}
      errors={errors}
      certificadoCamaraName={certificadoCamaraName}
      handlePickDocument={handlePickDocument}
      handleSavePress={handleSavePress}
      handleCancelPress={handleCancelPress}
      countries={countries}
      states={states}
      cities={cities}
      selectedCountry={selectedCountry}
      selectedState={selectedState}
      selectedCity={selectedCity}
      setSelectedCountry={setSelectedCountry}
      setSelectedState={setSelectedState}
      setSelectedCity={setSelectedCity}
      loadingTerritories={loadingTerritories}
    />
  );

  return (
    <React.Fragment>
      <View style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
        {Platform.OS === 'web' ? (
          <div style={{
            flex: '1',
            overflowY: 'auto',
            height: '100%',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div style={{ padding: '20px' }}>
            {renderFormContent()}
          </div>
        </div>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 40 + insets.bottom }
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {renderFormContent()}
          </ScrollView>
        )}
      </View>

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
  actionButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: "#024A77",
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  fileButton: {
    alignItems: "center",
    backgroundColor: "#024A77",
    borderRadius: 6,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  fileButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  fileInfo: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  form: {
    marginTop: 20,
    padding: 20,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 6,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 14,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  label: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  modalButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    paddingVertical: 12,
  },
  modalButtonPrimary: {
    backgroundColor: "#024A77",
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    borderColor: "#e2e8f0",
    borderWidth: 1,
  },
  modalButtonTextPrimary: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalButtonTextSecondary: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    maxWidth: 400,
    padding: 24,
    width: "100%",
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalText: {
    color: "#64748b",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  picker: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 40,
  },
  saveButton: {
    backgroundColor: "#024A77",
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  webContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});