import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

export default function Inicio() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.logo}>
        WORK24
      </Text>

      <Text style={estilos.titulo}>
        ¿Cómo querés ingresar?
      </Text>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => router.push('/cliente')}
      >
        <Text style={estilos.textoBoton}>
          Soy Cliente
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => router.push('/profesional')}
      >
        <Text style={estilos.textoBoton}>
          Soy Profesional
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

  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 50,
  },

  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
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
});
