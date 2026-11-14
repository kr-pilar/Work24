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

export default function RegistroGoogleProfesional() {
  const [registro, setRegistro] = useState<RegistroGoogle | null>(null);
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [profesiones, setProfesiones] = useState<string[]>([]);
  const [matriculas, setMatriculas] = useState<{ [key: string]: string }>({});
  const [tienenMatricula, setTienenMatricula] = useState<string[]>([]);
  const [otroOficio, setOtroOficio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [autorizaContactoWhatsapp, setAutorizaContactoWhatsapp] =
    useState(false);

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
                onPress: () => router.replace('/login-profesional'),
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

        router.replace('/login-profesional');
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
      dni.trim() === '' ||
      telefono.trim() === '' ||
      descripcion.trim() === ''
    ) {
      Alert.alert(
        'Faltan datos',
        'Completá tu DNI, teléfono y descripción de servicios.'
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
    } else if (!registro) {
      Alert.alert(
        'Error',
        'No se encontraron los datos necesarios para completar el registro.'
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
            `${API_URL}/auth/google/registro-profesional`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                onboardingToken: registro.onboardingToken,
                dni: dni.trim(),
                telefono: telefono.trim(),
                descripcion: descripcion.trim(),
                autorizaContactoWhatsapp: true,
                profesiones: datosMatriculas,
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
              'El registro profesional con Google se realizó correctamente.',
              [
                {
                  text: 'Continuar',
                  onPress: () => router.replace('/inicio-profesional'),
                },
              ]
            );
          }
        } catch (error) {
          console.error('Error en el registro profesional con Google:', error);

          Alert.alert(
            'Error de conexión',
            'No se pudo conectar con Work24. Verificá que el servidor esté funcionando y que el celular esté conectado a la misma Wi-Fi.'
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
      <Text style={estilos.titulo}>
        Crear cuenta profesional
      </Text>

      <Text style={estilos.descripcionInicial}>
        Completá tus datos para ofrecer tus servicios en Work24.
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

  descripcionInicial: {
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

  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#111111',
  },

  ayuda: {
    fontSize: 14,
    color: '#555555',
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
    color: '#111111',
  },

  matriculaContenedor: {
    marginLeft: 15,
    marginBottom: 10,
  },

  matriculaOpcion: {
    fontSize: 16,
    marginBottom: 10,
    color: '#111111',
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
    color: '#111111',
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
