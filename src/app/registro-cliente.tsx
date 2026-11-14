
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
import { router } from 'expo-router';
import { API_URL } from '../config/api';
import { guardarSesion } from '../storageSesion';

export default function RegistroCliente() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crearCuenta() {
    if (
      nombre.trim() === '' ||
      apellido.trim() === '' ||
      dni.trim() === '' ||
      email.trim() === '' ||
      telefono.trim() === '' ||
      contrasena === '' ||
      confirmarContrasena === ''
    ) {
      Alert.alert('Faltan datos', 'Completá todos los campos.');
    } else if (contrasena !== confirmarContrasena) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
    } else if (contrasena.length < 8) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener al menos 8 caracteres.'
      );
    } else {
      setEnviando(true);

      try {
        const respuesta = await fetch(
          `${API_URL}/auth/registro-cliente`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              dni: dni.trim(),
              email: email.trim().toLowerCase(),
              telefono: telefono.trim(),
              contrasena: contrasena,
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

          Alert.alert(
            'Cuenta creada',
            'Tu registro se realizó correctamente.',
            [
              {
                text: 'Continuar',
                onPress: () => router.replace('/inicio-cliente'),
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error de registro:', error);

        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con Work24. Verificá que el servidor esté funcionando y que el celular esté conectado a la misma Wi-Fi.'
        );
      } finally {
        setEnviando(false);
      }
    }
  }

  return (
    <ScrollView
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Crear cuenta</Text>

      <Text style={estilos.etiqueta}>Nombre</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ingresá tu nombre"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <Text style={estilos.etiqueta}>Apellido</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ingresá tu apellido"
        value={apellido}
        onChangeText={setApellido}
        autoCapitalize="words"
      />

      <Text style={estilos.etiqueta}>DNI</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ingresá tu DNI"
        keyboardType="number-pad"
        value={dni}
        onChangeText={setDni}
      />

      <Text style={estilos.etiqueta}>Email</Text>
      <TextInput
        style={estilos.input}
        placeholder="ejemplo@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Text style={estilos.etiqueta}>Teléfono</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ingresá tu teléfono"
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={setTelefono}
      />

      <Text style={estilos.etiqueta}>Contraseña</Text>
      <TextInput
        style={estilos.input}
        placeholder="Ingresá tu contraseña"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />

      <Text style={estilos.etiqueta}>Confirmar contraseña</Text>
      <TextInput
        style={estilos.input}
        placeholder="Volvé a ingresar tu contraseña"
        secureTextEntry
        value={confirmarContrasena}
        onChangeText={setConfirmarContrasena}
      />

      <TouchableOpacity
        style={estilos.boton}
        onPress={crearCuenta}
        activeOpacity={0.8}
        disabled={enviando}
      >
        <Text style={estilos.textoBoton}>
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
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

  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#111111',
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

  boton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 25,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
