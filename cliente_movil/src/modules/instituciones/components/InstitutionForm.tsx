import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { institutionalClientService } from "../../../services/institutionalClientService";

interface FormContentProps {
  nombreInstitucion: string;
  setNombreInstitucion: (value: string) => void;
  direccion: string;
  setDireccion: (value: string) => void;
  direccionInstitucional: string;
  setDireccionInstitucional: (value: string) => void;
  identificacionTributaria: string;
  setIdentificacionTributaria: (value: string) => void;
  handleTaxIdBlur: () => void;
  isValidatingTaxId: boolean;
  isTaxIdValid: boolean;
  representanteLegal: string;
  setRepresentanteLegal: (value: string) => void;
  telefono: string;
  setTelefono: (value: string) => void;
  justificacionAcceso: string;
  setJustificacionAcceso: (value: string) => void;

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
  isFormValid: boolean;
}

const TAX_ID_REGEX = /^[0-9-]+$/;

const FormContent: React.FC<FormContentProps> = ({
  nombreInstitucion,
  setNombreInstitucion,
  direccion,
  setDireccion,
  direccionInstitucional,
  setDireccionInstitucional,
  identificacionTributaria,
  setIdentificacionTributaria,
  handleTaxIdBlur,
  isValidatingTaxId,
  isTaxIdValid,
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
  loadingTerritories,
  isFormValid
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
      testID="institution-tax-id-input"
      value={identificacionTributaria}
      onChangeText={setIdentificacionTributaria}
      onBlur={handleTaxIdBlur}
      autoCapitalize="none"
      autoCorrect={false}
    />
    {isValidatingTaxId && !errors.identificacionTributaria && (
      <Text style={styles.helperText}>Validando identificación tributaria...</Text>
    )}
    {!isValidatingTaxId && isTaxIdValid && !errors.identificacionTributaria && (
      <Text style={styles.successText}>Identificación tributaria validada correctamente</Text>
    )}
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
        testID="institution-country-picker"
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
            testID="institution-state-picker"
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
            testID="institution-city-picker"
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
        style={[
          styles.actionButton,
          styles.saveButton,
          !isFormValid && styles.disabledButton
        ]}
        onPress={handleSavePress}
        disabled={!isFormValid}
        testID="institution-register-button"
      >
        <Text style={[
          styles.actionButtonText,
          !isFormValid && styles.disabledButtonText
        ]}>Registrar</Text>
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
  onSubmit: (institution: InstitutionalClientCreate) => Promise<void>;
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

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isTaxIdValid, setIsTaxIdValid] = useState(false);
  const [isValidatingTaxId, setIsValidatingTaxId] = useState(false);
  const lastValidatedTaxIdRef = useRef<string | null>(null);
  const taxIdValidationRequestRef = useRef(0);
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

  const handleTaxIdChange = useCallback((value: string) => {
    setIdentificacionTributaria(value);
    setIsTaxIdValid(false);
    lastValidatedTaxIdRef.current = null;
    taxIdValidationRequestRef.current += 1;
    setIsValidatingTaxId(false);

    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        updatedErrors.identificacionTributaria = "La identificación tributaria es requerida";
      } else if (!TAX_ID_REGEX.test(trimmedValue)) {
        updatedErrors.identificacionTributaria = "Solo se permiten números y guiones";
      } else {
        delete updatedErrors.identificacionTributaria;
      }

      return updatedErrors;
    });
  }, []);

  const handleTaxIdBlur = useCallback(async () => {
    const trimmedValue = identificacionTributaria.trim();

    if (!trimmedValue) {
      setIsTaxIdValid(false);
      setErrors((prevErrors) => ({
        ...prevErrors,
        identificacionTributaria: "La identificación tributaria es requerida",
      }));
      return;
    }

    if (!TAX_ID_REGEX.test(trimmedValue)) {
      setIsTaxIdValid(false);
      setErrors((prevErrors) => ({
        ...prevErrors,
        identificacionTributaria: "Solo se permiten números y guiones",
      }));
      return;
    }

    if (lastValidatedTaxIdRef.current === trimmedValue && isTaxIdValid) {
      return;
    }

    const currentRequestId = taxIdValidationRequestRef.current + 1;
    taxIdValidationRequestRef.current = currentRequestId;

    setIsValidatingTaxId(true);

    try {
      const result = await institutionalClientService.verifyTaxIdentification(trimmedValue);

      if (taxIdValidationRequestRef.current !== currentRequestId) {
        return;
      }

      if (result.isValid) {
        lastValidatedTaxIdRef.current = trimmedValue;
        setIsTaxIdValid(true);
        setErrors((prevErrors) => {
          const { identificacionTributaria, ...rest } = prevErrors;
          return rest;
        });
      } else {
        lastValidatedTaxIdRef.current = null;
        setIsTaxIdValid(false);
        setErrors((prevErrors) => ({
          ...prevErrors,
          identificacionTributaria:
            result.message ?? "La identificación tributaria no es válida",
        }));
      }
    } catch (error) {
      if (taxIdValidationRequestRef.current !== currentRequestId) {
        return;
      }

      lastValidatedTaxIdRef.current = null;
      setIsTaxIdValid(false);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo validar la identificación tributaria";

      setErrors((prevErrors) => ({
        ...prevErrors,
        identificacionTributaria: message,
      }));
    } finally {
      if (taxIdValidationRequestRef.current === currentRequestId) {
        setIsValidatingTaxId(false);
      }
    }
  }, [identificacionTributaria, isTaxIdValid]);

  const checkFormValidity = useCallback(() => {
    const trimmedTaxId = identificacionTributaria.trim();
    const hasValidTaxId =
      !!trimmedTaxId && TAX_ID_REGEX.test(trimmedTaxId) && isTaxIdValid;

    const isValid = !!(
      nombreInstitucion.trim() &&
      direccion.trim() &&
      direccionInstitucional.trim() &&
      /\S+@\S+\.\S+/.test(direccionInstitucional) &&
      hasValidTaxId &&
      representanteLegal.trim() &&
      telefono.trim() &&
      selectedCity
    );
    setIsFormValid(isValid);
    return isValid;
  }, [
    nombreInstitucion,
    direccion,
    direccionInstitucional,
    identificacionTributaria,
    isTaxIdValid,
    representanteLegal,
    telefono,
    selectedCity
  ]);

  useEffect(() => {
    checkFormValidity();
  }, [checkFormValidity]);

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
    const trimmedTaxId = identificacionTributaria.trim();
    if (!trimmedTaxId) {
      newErrors.identificacionTributaria = "La identificación tributaria es requerida";
    } else if (!TAX_ID_REGEX.test(trimmedTaxId)) {
      newErrors.identificacionTributaria = "Solo se permiten números y guiones";
    } else if (!isTaxIdValid) {
      newErrors.identificacionTributaria = "La identificación tributaria no ha sido validada";
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
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  const handleSavePress = () => {
    if (validateForm()) {
      setShowSaveModal(true);
    }
  };

  const handleCancelPress = () => {
    setShowCancelModal(true);
  };

  const resetForm = () => {
    setNombreInstitucion("");
    setDireccion("");
    setDireccionInstitucional("");
    setIdentificacionTributaria("");
    setRepresentanteLegal("");
    setTelefono("");
    setJustificacionAcceso("");
    setCertificadoCamara(null);
    setCertificadoCamaraName(null);
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity("");
    setErrors({});
    setIsTaxIdValid(false);
    setIsValidatingTaxId(false);
    lastValidatedTaxIdRef.current = null;
    taxIdValidationRequestRef.current = 0;
  };

  const handleConfirmSave = async () => {
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
    
    try {
      await onSubmit(institutionData);
      setShowSuccessModal(true);
    } catch (error) {
      setShowErrorModal(true);
    }
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
      setIdentificacionTributaria={handleTaxIdChange}
      handleTaxIdBlur={handleTaxIdBlur}
      isValidatingTaxId={isValidatingTaxId}
      isTaxIdValid={isTaxIdValid}
      representanteLegal={representanteLegal}
      setRepresentanteLegal={setRepresentanteLegal}
      telefono={telefono}
      setTelefono={setTelefono}
      justificacionAcceso={justificacionAcceso}
      setJustificacionAcceso={setJustificacionAcceso}

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
      isFormValid={isFormValid}
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
            <Text style={styles.modalTitle}>¿Confirmar registro?</Text>
            <Text style={styles.modalText}>
              ¿Está seguro que desea registrar esta institución con la información ingresada?
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
                testID="institution-confirm-register-button"
              >
                <Text style={styles.modalButtonTextPrimary}>Registrar</Text>
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

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registro Exitoso</Text>
            <Text style={styles.modalText}>
              La institución ha sido registrada correctamente en el sistema.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setShowSuccessModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de error */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error en el Registro</Text>
            <Text style={styles.modalText}>
              No se pudo registrar la institución. Por favor verifique la información e intente nuevamente.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.modalButtonTextPrimary}>Aceptar</Text>
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
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
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
  helperText: {
    color: "#64748b",
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
  successText: {
    color: "#16a34a",
    fontSize: 12,
    marginTop: 4,
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