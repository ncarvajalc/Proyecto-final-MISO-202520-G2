import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { VisitCreate } from "../../../types/visit";

interface VisitFormProps {
  onSubmit: (visit: VisitCreate) => void;
  initialClientName?: string;
}

export const VisitForm: React.FC<VisitFormProps> = ({ onSubmit, initialClientName }) => {
  const [nombreInstitucion, setNombreInstitucion] = useState(initialClientName || "");
  const [direccion, setDireccion] = useState("");
  const [hora, setHora] = useState(new Date());
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [desplazamientoMinutos, setDesplazamientoMinutos] = useState("");
  const [horaSalida, setHoraSalida] = useState<Date | null>(null);
  const [showHoraSalidaPicker, setShowHoraSalidaPicker] = useState(false);
  const [estado, setEstado] = useState("Programada");
  const [observacion, setObservacion] = useState("");

  const estadoOptions = ["Programada", "En progreso", "Realizada", "Cancelada"];

  const handleSubmit = () => {
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nombre Institución *</Text>
        <TextInput
          style={styles.input}
          value={nombreInstitucion}
          onChangeText={setNombreInstitucion}
          placeholder="Ingrese nombre de la institución"
        />

        <Text style={styles.label}>Dirección *</Text>
        <TextInput
          style={styles.input}
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Ingrese dirección"
        />

        <Text style={styles.label}>Hora *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowHoraPicker(true)}
        >
          <Text>{hora.toLocaleString("es-ES")}</Text>
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
          keyboardType="numeric"
        />

        <Text style={styles.label}>Hora Salida</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowHoraSalidaPicker(true)}
        >
          <Text>
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

        <Text style={styles.label}>Estado *</Text>
        <View style={styles.estadoContainer}>
          {estadoOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.estadoOption,
                estado === option && styles.estadoOptionSelected,
              ]}
              onPress={() => setEstado(option)}
            >
              <Text
                style={[
                  styles.estadoText,
                  estado === option && styles.estadoTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Observación</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={observacion}
          onChangeText={setObservacion}
          placeholder="Ingrese observaciones"
          multiline={true}
          numberOfLines={4}
        />

        <View style={styles.buttonContainer}>
          <Button title="Guardar Visita" onPress={handleSubmit} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  estadoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  estadoOption: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    marginRight: 8,
    marginBottom: 8,
  },
  estadoOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  estadoText: {
    textAlign: "center",
    color: "#333",
  },
  estadoTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
});
