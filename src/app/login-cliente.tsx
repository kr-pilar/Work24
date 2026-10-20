import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { obtenerUsuarios, guardarUsuarioActual } from '../storage';

export default function LoginCliente() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');

  async function iniciarSesion() {
    if (email === '' || contrasena === '') {
      Alert.alert(
        'Faltan datos',
        'Completá el email y la contraseña.'
      );
    } else {
      const usuarios = await obtenerUsuarios();

      const usuarioEncontrado = usuarios.find(
        (usuario: any) =>
          usuario.email.toLowerCase() === email.toLowerCase() &&
          usuario.contrasena === contrasena &&
          usuario.tipo === 'cliente'
      );

      if (usuarioEncontrado) {
        await guardarUsuarioActual(usuarioEncontrado);

        Alert.alert(
          'Bienvenido',
          `Hola ${usuarioEncontrado.nombre}`,
          [
            {
              text: 'Continuar',
              onPress: () => router.replace('/inicio-cliente'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Datos incorrectos',
          'El email o la contraseña no son correctos.'
        );
      }
    }
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Iniciar sesión
      </Text>

      <Text style={estilos.subtitulo}>
        Cliente
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={estilos.input}
        placeholder="Contraseña"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />

      <TouchableOpacity
        style={estilos.boton}
        onPress={iniciarSesion}
      >
        <Text style={estilos.textoBoton}>
          Iniciar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },

  subtitulo: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },

  input: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
