import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
  obtenerRegistroGoogle,
  limpiarRegistroGoogle,
  type RegistroGoogle,
} from '../googleAuth';

export default function RegistroGoogleCliente() {
  const [registro, setRegistro] = useState<RegistroGoogle | null>(null);
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarRegistro() {
      try {
        const pendiente = await obtenerRegistroGoogle();

        if (!pendiente) {
          Alert.alert(
            'Registro no disponible',
            'No encontramos un registro de Google pendiente.',
            [
              {
                text: 'Continuar',
                onPress: () => router.replace('/login-cliente'),
              },
            ]
          );
        } else if (activo) {
          setRegistro(pendiente);
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'No se pudieron recuperar los datos de Google.'
        );

        router.replace('/login-cliente');
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarRegistro();

    return () => {
      activo = false;
    };
  }, []);

  async function crearCuenta() {
    if (dni.trim() === '' || telefono.trim() === '') {
      Alert.alert(
        'Faltan datos',
        'Completá tu DNI y número de teléfono.'
      );
    } else if (!registro) {
      Alert.alert(
        'Error',
        'No se encontraron los datos necesarios para completar el registro.'
      );
    } else {
      setEnviando(true);

      try {
        const respuesta = await fetch(
          `${API_URL}/auth/google/registro-cliente`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              onboardingToken: registro.onboardingToken,
              dni: dni.trim(),
              telefono: telefono.trim(),
            }),
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          Alert.alert(
            'No se pudo crear la cuenta',
            datos.error || 'Ocurrió un error durante el registro.'
          );
        } else {
          await guardarSesion(datos.token, datos.usuario);
          await limpiarRegistroGoogle();

          Alert.alert(
            'Cuenta creada',
            'Tu registro con Google se realizó correctamente.',
            [
              {
                text: 'Continuar',
                onPress: () => router.replace('/inicio-cliente'),
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error en el registro con Google:', error);

        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con Work24. Verificá que el servidor esté funcionando y que el celular esté conectado a la misma Wi-Fi.'
        );
      } finally {
        setEnviando(false);
      }
    }
  }

  if (cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" color="#0000cc" />
        <Text style={estilos.textoCargando}>
          Recuperando datos de Google...
        </Text>
      </View>
    );
  }

  if (!registro) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Completar registro</Text>

      <Text style={estilos.descripcion}>
        Ya verificamos tu cuenta de Google. Completá los siguientes datos
        para terminar de crear tu cuenta en Work24.
      </Text>

      <Text style={estilos.etiqueta}>Nombre</Text>
      <TextInput
        style={estilos.inputBloqueado}
        value={registro.datosGoogle.nombre}
        editable={false}
      />

      <Text style={estilos.etiqueta}>Apellido</Text>
      <TextInput
        style={estilos.inputBloqueado}
        value={registro.datosGoogle.apellido}
        editable={false}
      />

      <Text style={estilos.etiqueta}>Correo electrónico</Text>
      <TextInput
        style={estilos.inputBloqueado}
        value={registro.datosGoogle.email}
        editable={false}
      />

      <Text style={estilos.etiqueta}>DNI</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ingresá tu DNI"
        keyboardType="number-pad"
        value={dni}
        onChangeText={setDni}
      />

      <Text style={estilos.etiqueta}>Teléfono</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ingresá tu teléfono"
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={setTelefono}
      />

      <TouchableOpacity
        style={[
          estilos.boton,
          enviando && estilos.botonDeshabilitado,
        ]}
        onPress={crearCuenta}
        disabled={enviando}
        activeOpacity={0.8}
      >
        <Text style={estilos.textoBoton}>
          {enviando ? 'Creando cuenta...' : 'Completar registro'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 25,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  textoCargando: {
    marginTop: 15,
    fontSize: 16,
    color: '#222222',
  },

  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#111111',
  },

  descripcion: {
    fontSize: 15,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    color: '#111111',
  },

  inputBloqueado: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#eeeeee',
    color: '#444444',
  },

  boton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 25,
  },

  botonDeshabilitado: {
    opacity: 0.5,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
