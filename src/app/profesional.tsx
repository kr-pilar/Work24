import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

export default function Profesional() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Profesional
      </Text>

      <Text style={estilos.subtitulo}>
        ¿Qué querés hacer?
      </Text>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => router.push('/login-profesional')}
      >
        <Text style={estilos.textoBoton}>
          Iniciar sesión
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.botonSecundario}
        onPress={() => router.push('/registro-profesional')}
      >
        <Text style={estilos.textoBotonSecundario}>
          Registrarme
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
  },

  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitulo: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  botonSecundario: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoBotonSecundario: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
