import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NuevoTrabajo() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [urgencia, setUrgencia] = useState('');

  function publicarTrabajo() {
    if (
      titulo === '' ||
      descripcion === '' ||
      ubicacion === '' ||
      urgencia === ''
    ) {
      Alert.alert(
        'Faltan datos',
        'Completá todos los campos.'
      );
    } else {
      router.push({
        pathname: '/profesionales-disponibles',
        params: {
          titulo: titulo,
          descripcion: descripcion,
          ubicacion: ubicacion,
          urgencia: urgencia,
        },
      });
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Nuevo trabajo
      </Text>

      <Text style={estilos.etiqueta}>
        ¿Qué trabajo necesitás?
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Ej: Reparación eléctrica"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={estilos.etiqueta}>
        Descripción
      </Text>

      <TextInput
        style={estilos.inputGrande}
        placeholder="Contá qué necesitás realizar..."
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Text style={estilos.etiqueta}>
        Ubicación
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Ej: Pilar, Buenos Aires"
        value={ubicacion}
        onChangeText={setUbicacion}
      />

      <Text style={estilos.etiqueta}>
        Urgencia
      </Text>

      <View style={estilos.urgencias}>
        <TouchableOpacity
          style={urgencia === 'Baja' ? estilos.urgenciaSeleccionada : estilos.urgencia}
          onPress={() => setUrgencia('Baja')}
        >
          <Text style={estilos.textoUrgencia}>
            Baja
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={urgencia === 'Media' ? estilos.urgenciaSeleccionada : estilos.urgencia}
          onPress={() => setUrgencia('Media')}
        >
          <Text style={estilos.textoUrgencia}>
            Media
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={urgencia === 'Alta' ? estilos.urgenciaSeleccionada : estilos.urgencia}
          onPress={() => setUrgencia('Alta')}
        >
          <Text style={estilos.textoUrgencia}>
            Alta
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={publicarTrabajo}
      >
        <Text style={estilos.textoBoton}>
          Publicar trabajo
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: 20,
    backgroundColor: '#ffffff',
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },

  etiqueta: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },

  inputGrande: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  urgencias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  urgencia: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },

  urgenciaSeleccionada: {
    width: '31%',
    backgroundColor: '#000000',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },

  textoUrgencia: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  boton: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
