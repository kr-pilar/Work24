import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { guardarUsuarios, obtenerUsuarios } from '../storage';

export default function RegistroCliente() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');

  async function crearCuenta() {
    if (
      nombre === '' ||
      apellido === '' ||
      email === '' ||
      telefono === '' ||
      contrasena === '' ||
      confirmarContrasena === ''
    ) {
      Alert.alert('Faltan datos', 'Completá todos los campos.');
    } else if (contrasena !== confirmarContrasena) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
    } else {
      const usuarios = await obtenerUsuarios();

      const existe = usuarios.some(
        (usuario: any) =>
          usuario.email.toLowerCase() === email.toLowerCase()
      );

      if (existe) {
        Alert.alert(
          'Email registrado',
          'Ya existe una cuenta con ese email.'
        );
      } else {
        const nuevoUsuario = {
          id: Date.now(),
          nombre: nombre,
          apellido: apellido,
          email: email,
          telefono: telefono,
          contrasena: contrasena,
          tipo: 'cliente',
        };

        usuarios.push(nuevoUsuario);

        await guardarUsuarios(usuarios);

        Alert.alert(
          'Cuenta creada',
          'El registro se realizó correctamente.'
        );
      }
    }
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Crear cuenta</Text>

      <TextInput
        style={estilos.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={estilos.input}
        placeholder="Apellido"
        value={apellido}
        onChangeText={setApellido}
      />

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
        placeholder="Teléfono"
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={setTelefono}
      />

      <TextInput
        style={estilos.input}
        placeholder="Contraseña"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />

      <TextInput
        style={estilos.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirmarContrasena}
        onChangeText={setConfirmarContrasena}
      />

      <TouchableOpacity
        style={estilos.boton}
        onPress={crearCuenta}
      >
        <Text style={estilos.textoBoton}>Crear cuenta</Text>
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
