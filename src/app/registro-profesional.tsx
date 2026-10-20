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

const PROFESIONES_INICIALES = [
  'Electricista',
  'Plomero',
  'Gasista',
  'Albañil',
  'Pintor',
  'Carpintero',
  'Refrigeración',
  'Herrero',
  'Técnico en electrónica',
  'Jardinero',
];

export default function RegistroProfesional() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [profesiones, setProfesiones] = useState<string[]>([]);
  const [matriculas, setMatriculas] = useState<{ [key: string]: string }>({});
  const [tienenMatricula, setTienenMatricula] = useState<string[]>([]);
  const [otroOficio, setOtroOficio] = useState('');
  const [descripcion, setDescripcion] = useState('');

  function seleccionarProfesion(profesion: string) {
    if (profesiones.includes(profesion)) {
      setProfesiones(
        profesiones.filter((item) => item !== profesion)
      );

      setTienenMatricula(
        tienenMatricula.filter((item) => item !== profesion)
      );

      const nuevasMatriculas = { ...matriculas };
      delete nuevasMatriculas[profesion];
      setMatriculas(nuevasMatriculas);
    } else {
      setProfesiones([...profesiones, profesion]);
    }
  }

  function cambiarMatricula(profesion: string, valor: string) {
    setMatriculas({
      ...matriculas,
      [profesion]: valor,
    });
  }

  function cambiarTieneMatricula(profesion: string) {
    if (tienenMatricula.includes(profesion)) {
      setTienenMatricula(
        tienenMatricula.filter((item) => item !== profesion)
      );

      const nuevasMatriculas = { ...matriculas };
      delete nuevasMatriculas[profesion];
      setMatriculas(nuevasMatriculas);
    } else {
      setTienenMatricula([...tienenMatricula, profesion]);
    }
  }

  function agregarOtroOficio() {
    const oficio = otroOficio.trim();

    if (oficio === '') {
      Alert.alert(
        'Falta el oficio',
        'Escribí el nombre del nuevo oficio.'
      );
    } else {
      const existe = PROFESIONES_INICIALES.some(
        (item) => item.toLowerCase() === oficio.toLowerCase()
      );

      const yaAgregado = profesiones.some(
        (item) => item.toLowerCase() === oficio.toLowerCase()
      );

      if (existe || yaAgregado) {
        Alert.alert(
          'Oficio existente',
          'Ese oficio ya está disponible para seleccionar.'
        );
      } else {
        setProfesiones([...profesiones, oficio]);
        setOtroOficio('');
        Alert.alert(
          'Oficio agregado',
          `${oficio} fue agregado a tu selección.`
        );
      }
    }
  }

  async function crearCuenta() {
  if (
    nombre === '' ||
    apellido === '' ||
    email === '' ||
    telefono === '' ||
    contrasena === '' ||
    confirmarContrasena === '' ||
    descripcion === ''
  ) {
    Alert.alert(
      'Faltan datos',
      'Completá todos los campos obligatorios.'
    );
  } else if (profesiones.length === 0) {
    Alert.alert(
      'Falta profesión',
      'Seleccioná al menos una profesión u oficio.'
    );
  } else if (contrasena !== confirmarContrasena) {
    Alert.alert(
      'Error',
      'Las contraseñas no coinciden.'
    );
  } else {
    let matriculasValidas = true;

    tienenMatricula.forEach((profesion) => {
      if (
        matriculas[profesion] === undefined ||
        matriculas[profesion].trim() === ''
      ) {
        matriculasValidas = false;
      }
    });

    if (!matriculasValidas) {
      Alert.alert(
        'Falta matrícula',
        'Completá la matrícula de cada profesión en la que indicaste que estás matriculado.'
      );
    } else {
      const { guardarUsuarios, obtenerUsuarios } = await import('../storage');

      const usuarios = await obtenerUsuarios();

      const usuarioExistente = usuarios.find(
        (usuario: any) =>
          usuario.email.toLowerCase() === email.toLowerCase()
      );

      if (usuarioExistente) {
        Alert.alert(
          'Email existente',
          'Ya existe una cuenta registrada con ese email.'
        );
      } else {
        const datosMatriculas = profesiones.map((profesion) => ({
          profesion: profesion,
          tieneMatricula: tienenMatricula.includes(profesion),
          matricula: matriculas[profesion] || '',
        }));

        const nuevoUsuario = {
          id: Date.now(),
          nombre: nombre,
          apellido: apellido,
          email: email,
          telefono: telefono,
          contrasena: contrasena,
          tipo: 'profesional',
          profesiones: datosMatriculas,
          descripcion: descripcion,
        };

        usuarios.push(nuevoUsuario);

        await guardarUsuarios(usuarios);

        Alert.alert(
          'Cuenta creada',
          'El registro del profesional se realizó correctamente.'
        );
      }
    }
  }
}

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Crear cuenta profesional
      </Text>

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

      <Text style={estilos.subtitulo}>
        Profesiones u oficios
      </Text>

      <Text style={estilos.ayuda}>
        Podés seleccionar más de una profesión.
      </Text>

      {PROFESIONES_INICIALES.map((profesion) => (
        <View key={profesion}>
          <TouchableOpacity
            style={
              profesiones.includes(profesion)
                ? estilos.profesionSeleccionada
                : estilos.profesion
            }
            onPress={() => seleccionarProfesion(profesion)}
          >
            <Text style={estilos.textoProfesion}>
              {profesiones.includes(profesion) ? '✓ ' : ''}
              {profesion}
            </Text>
          </TouchableOpacity>

          {profesiones.includes(profesion) && (
            <View style={estilos.matriculaContenedor}>
              <TouchableOpacity
                onPress={() => cambiarTieneMatricula(profesion)}
              >
                <Text style={estilos.matriculaOpcion}>
                  {tienenMatricula.includes(profesion)
                    ? '☑ Tengo matrícula'
                    : '☐ Tengo matrícula'}
                </Text>
              </TouchableOpacity>

              {tienenMatricula.includes(profesion) && (
                <TextInput
                  style={estilos.input}
                  placeholder={`Matrícula de ${profesion}`}
                  value={matriculas[profesion] || ''}
                  onChangeText={(valor) =>
                    cambiarMatricula(profesion, valor)
                  }
                />
              )}
            </View>
          )}
        </View>
      ))}

      <Text style={estilos.subtitulo}>
        ¿No encontrás tu oficio?
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Escribí otro oficio"
        value={otroOficio}
        onChangeText={setOtroOficio}
      />

      <TouchableOpacity
        style={estilos.botonSecundario}
        onPress={agregarOtroOficio}
      >
        <Text style={estilos.textoBotonSecundario}>
          Agregar oficio
        </Text>
      </TouchableOpacity>

      <Text style={estilos.subtitulo}>
        Descripción de servicios
      </Text>

      <TextInput
        style={[estilos.input, estilos.descripcion]}
        placeholder="Describí los servicios que ofrecés"
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <TouchableOpacity
        style={estilos.boton}
        onPress={crearCuenta}
      >
        <Text style={estilos.textoBoton}>
          Crear cuenta
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: '#ffffff',
  },

  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },

  ayuda: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },

  profesion: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },

  profesionSeleccionada: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#eeeeee',
  },

  textoProfesion: {
    fontSize: 16,
  },

  matriculaContenedor: {
    marginLeft: 15,
    marginBottom: 10,
  },

  matriculaOpcion: {
    fontSize: 16,
    marginBottom: 10,
  },

  botonSecundario: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },

  textoBotonSecundario: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  descripcion: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  boton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
