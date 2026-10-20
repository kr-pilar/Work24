import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfesionalesDisponibles() {
  const { titulo, descripcion, ubicacion, urgencia } =
    useLocalSearchParams<{
      titulo: string;
      descripcion: string;
      ubicacion: string;
      urgencia: string;
    }>();

  const [seleccionado, setSeleccionado] = useState('');

  function seleccionarProfesional(nombre: string) {
    setSeleccionado(nombre);

    Alert.alert(
      'Profesional seleccionado',
      `${nombre} fue seleccionado para este trabajo.`
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Profesionales disponibles
      </Text>

      <Text style={estilos.subtitulo}>
        Elegí el profesional que querés consultar
      </Text>

      <View style={estilos.profesional}>
        <Text style={estilos.nombre}>
          Juan Pérez
        </Text>

        <Text style={estilos.profesion}>
          ⚡ Electricista
        </Text>

        <Text style={estilos.dato}>
          ⭐ 4.8 / 5
        </Text>

        <Text style={estilos.dato}>
          📍 1.2 km
        </Text>

        <Text style={estilos.disponible}>
          🟢 Disponible
        </Text>

        <TouchableOpacity
          style={
            seleccionado === 'Juan Pérez'
              ? estilos.botonSeleccionado
              : estilos.boton
          }
          onPress={() => seleccionarProfesional('Juan Pérez')}
        >
          <Text
            style={
              seleccionado === 'Juan Pérez'
                ? estilos.textoBotonSeleccionado
                : estilos.textoBoton
            }
          >
            {seleccionado === 'Juan Pérez'
              ? 'Seleccionado'
              : 'Seleccionar'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.profesional}>
        <Text style={estilos.nombre}>
          Carlos Gómez
        </Text>

        <Text style={estilos.profesion}>
          🔧 Plomero
        </Text>

        <Text style={estilos.dato}>
          ⭐ 4.6 / 5
        </Text>

        <Text style={estilos.dato}>
          📍 2.5 km
        </Text>

        <Text style={estilos.disponible}>
          🟢 Disponible
        </Text>

        <TouchableOpacity
          style={
            seleccionado === 'Carlos Gómez'
              ? estilos.botonSeleccionado
              : estilos.boton
          }
          onPress={() => seleccionarProfesional('Carlos Gómez')}
        >
          <Text
            style={
              seleccionado === 'Carlos Gómez'
                ? estilos.textoBotonSeleccionado
                : estilos.textoBoton
            }
          >
            {seleccionado === 'Carlos Gómez'
              ? 'Seleccionado'
              : 'Seleccionar'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={estilos.botonContinuar}
        onPress={() => {
          if (seleccionado === '') {
            Alert.alert(
              'Seleccioná un profesional',
              'Elegí un profesional para continuar.'
            );
          } else {
            router.push({
              pathname: '/confirmar-solicitud',
              params: {
                profesional: seleccionado,
                titulo: titulo,
                descripcion: descripcion,
                ubicacion: ubicacion,
                urgencia: urgencia,
              },
            });
          }
        }}
      >
        <Text style={estilos.textoBoton}>
          Continuar
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
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  subtitulo: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 25,
  },

  profesional: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },

  nombre: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  profesion: {
    fontSize: 17,
    marginBottom: 10,
  },

  dato: {
    fontSize: 16,
    marginBottom: 5,
  },

  disponible: {
    fontSize: 16,
    marginBottom: 12,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },

  botonSeleccionado: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 11,
    borderRadius: 8,
    alignItems: 'center',
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  textoBotonSeleccionado: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  botonContinuar: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
});
