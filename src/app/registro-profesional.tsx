
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
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [profesiones, setProfesiones] = useState<string[]>([]);
  const [matriculas, setMatriculas] = useState<{ [key: string]: string }>({});
  const [tienenMatricula, setTienenMatricula] = useState<string[]>([]);
  const [otroOficio, setOtroOficio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [autorizaContactoWhatsapp, setAutorizaContactoWhatsapp] =
    useState(false);

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
      nombre.trim() === '' ||
      apellido.trim() === '' ||
      dni.trim() === '' ||
      email.trim() === '' ||
      telefono.trim() === '' ||
      contrasena === '' ||
      confirmarContrasena === '' ||
      descripcion.trim() === ''
    ) {
      Alert.alert(
        'Faltan datos',
        'Completá todos los campos obligatorios.'
      );
    } else if (!autorizaContactoWhatsapp) {
      Alert.alert(
        'Autorización obligatoria',
        'Debés autorizar a Work24 a compartir tu teléfono con los clientes que habiliten el contacto.'
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
    } else if (contrasena.length < 8) {
      Alert.alert(
        'Contraseña demasiado corta',
        'La contraseña debe tener al menos 8 caracteres.'
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
        setEnviando(true);

        try {
          const datosMatriculas = profesiones.map((profesion) => ({
            profesion: profesion,
            tieneMatricula: tienenMatricula.includes(profesion),
            matricula: tienenMatricula.includes(profesion)
              ? matriculas[profesion].trim()
              : '',
          }));

          const respuesta = await fetch(
            `${API_URL}/auth/registro-profesional`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                dni: dni.trim(),
                email: email.trim(),
                telefono: telefono.trim(),
                contrasena: contrasena,
                autorizaContactoWhatsapp: true,
                profesiones: datosMatriculas,
                descripcion: descripcion.trim(),
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
              'El registro del profesional se realizó correctamente.',
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
  }

  const profesionesParaMostrar = [
    ...PROFESIONES_INICIALES,
    ...profesiones.filter(
      (item) => !PROFESIONES_INICIALES.includes(item)
    ),
  ];

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
        placeholder="DNI"
        keyboardType="numeric"
        value={dni}
        onChangeText={setDni}
      />

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

      {profesionesParaMostrar.map((profesion) => (
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
        style={estilos.autorizacion}
        onPress={() =>
          setAutorizaContactoWhatsapp(!autorizaContactoWhatsapp)
        }
        activeOpacity={0.8}
      >
        <Text style={estilos.textoAutorizacion}>
          {autorizaContactoWhatsapp ? '☑' : '☐'} Autorizo el contacto por WhatsApp
        </Text>
      </TouchableOpacity>

      <Text style={estilos.ayudaAutorizacion}>
        Autorizo a Work24 a compartir mi número de teléfono con los
        clientes que hayan habilitado el contacto conmigo. Mi número
        no será público y solo se compartirá cuando Work24 valide el
        contacto. Esta autorización es obligatoria para ofrecer mis
        servicios y puedo revocarla desde mi cuenta.
      </Text>

      <TouchableOpacity
        style={[
          estilos.boton,
          enviando && estilos.botonDeshabilitado,
        ]}
        onPress={crearCuenta}
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

  autorizacion: {
    borderWidth: 2,
    borderColor: '#0055cc',
    borderRadius: 8,
    padding: 14,
    marginTop: 15,
    marginBottom: 8,
    backgroundColor: '#eef5ff',
  },

  textoAutorizacion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003399',
  },

  ayudaAutorizacion: {
    fontSize: 14,
    lineHeight: 21,
    color: '#333333',
    marginBottom: 15,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
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
