
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
import { API_URL } from '../config/api';
import { guardarSesion } from '../storageSesion';
import {
  autenticarConGoogle,
  guardarRegistroGoogle,
} from '../googleAuth';

export default function LoginProfesional() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviandoGoogle, setEnviandoGoogle] = useState(false);

  async function iniciarSesion() {
    if (email.trim() === '' || contrasena === '') {
      Alert.alert('Faltan datos', 'Completá el email y la contraseña.');
    } else {
      setEnviando(true);

      try {
        const respuesta = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            contrasena,
            tipo: 'profesional',
          }),
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          Alert.alert(
            'No se pudo iniciar sesión',
            datos.error || 'El email o la contraseña no son correctos.'
          );
        } else {
          await guardarSesion(datos.token, datos.usuario);

          Alert.alert(
            'Bienvenido',
            `Hola ${datos.usuario.nombre}`,
            [
              {
                text: 'Continuar',
                onPress: () => router.replace('/inicio-profesional'),
              },
            ]
          );
        }
      } catch (error) {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con el servidor de Work24. Verificá que el backend esté funcionando y que el teléfono esté conectado a la misma red Wi-Fi.'
        );
      } finally {
        setEnviando(false);
      }
    }
  }

  async function iniciarSesionGoogle() {
    setEnviandoGoogle(true);

    try {
      const resultado = await autenticarConGoogle('profesional');

      if ('requiereRegistro' in resultado) {
        await guardarRegistroGoogle(
          resultado.onboardingToken,
          resultado.datosGoogle
        );

        router.push('/registro-google-profesional');
      } else {
        await guardarSesion(resultado.token, resultado.usuario);

        Alert.alert(
          'Bienvenido',
          `Hola ${resultado.usuario.nombre}`,
          [
            {
              text: 'Continuar',
              onPress: () => router.replace('/inicio-profesional'),
            },
          ]
        );
      }
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión con Google.';

      if (mensaje !== 'Inicio de sesión cancelado.') {
        Alert.alert('Error con Google', mensaje);
      }
    } finally {
      setEnviandoGoogle(false);
    }
  }

  const ocupado = enviando || enviandoGoogle;

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Iniciar sesión</Text>

      <Text style={estilos.subtitulo}>Profesional</Text>

      <TextInput
        style={estilos.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
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
        style={[
          estilos.boton,
          ocupado && estilos.botonDeshabilitado,
        ]}
        onPress={iniciarSesion}
        disabled={ocupado}
      >
        <Text style={estilos.textoBoton}>
          {enviando ? 'Ingresando...' : 'Iniciar sesión'}
        </Text>
      </TouchableOpacity>

      <View style={estilos.separador}>
        <View style={estilos.linea} />
        <Text style={estilos.textoSeparador}>O también podés</Text>
        <View style={estilos.linea} />
      </View>

      <TouchableOpacity
        style={[
          estilos.botonGoogle,
          ocupado && estilos.botonDeshabilitado,
        ]}
        onPress={iniciarSesionGoogle}
        disabled={ocupado}
      >
        <Text style={estilos.textoGoogle}>
          {enviandoGoogle ? 'Conectando con Google...' : 'Continuar con Google'}
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

  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },

  linea: {
    flex: 1,
    height: 1,
    backgroundColor: '#cccccc',
  },

  textoSeparador: {
    marginHorizontal: 12,
    color: '#666666',
  },

  botonGoogle: {
    borderWidth: 1,
    borderColor: '#999999',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  textoGoogle: {
    color: '#222222',
    fontSize: 17,
    fontWeight: 'bold',
  },

  botonDeshabilitado: {
    opacity: 0.5,
  },
});
