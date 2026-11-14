import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../config/api';
import { obtenerToken } from '../storageSesion';
import MapaUbicacion from '../components/MapaUbicacion';

type Profesion = {
  id: number;
  nombre: string;
};

type PuntoUbicacion = {
  latitud: number;
  longitud: number;
  direccion: string;
};

export default function NuevoTrabajo() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [urgencia, setUrgencia] = useState('');
  const [profesionId, setProfesionId] = useState<number | null>(null);
  const [profesiones, setProfesiones] = useState<Profesion[]>([]);
  const [cargandoProfesiones, setCargandoProfesiones] = useState(true);
  const [cargando, setCargando] = useState(false);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [latitudTrabajo, setLatitudTrabajo] = useState<number | null>(null);
  const [longitudTrabajo, setLongitudTrabajo] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarProfesiones();
  }, []);

  async function cargarProfesiones() {
    try {
      const respuesta = await fetch(`${API_URL}/profesiones`);
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error('No se pudieron cargar las profesiones');
      }

      const lista = Array.isArray(datos)
        ? datos
        : datos.profesiones;

      if (!Array.isArray(lista)) {
        throw new Error('Respuesta inválida');
      }

      setProfesiones(lista);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron cargar las profesiones. Verificá la conexión con Work24.'
      );
    } finally {
      setCargandoProfesiones(false);
    }
  }

  const profesionSeleccionada = profesiones.find(
    (profesion) => profesion.id === profesionId
  );

  const profesionesFiltradas = profesiones.filter((profesion) =>
    profesion.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(
        busqueda
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      )
  );

  function seleccionarProfesion(profesion: Profesion) {
    setProfesionId(profesion.id);
    setBusqueda('');
    setSelectorVisible(false);
  }

  function confirmarUbicacion(punto: PuntoUbicacion) {
    setLatitudTrabajo(punto.latitud);
    setLongitudTrabajo(punto.longitud);
    setUbicacion(punto.direccion);
  }

  async function enviarTrabajo() {
    setCargando(true);

    try {
      const token = await obtenerToken();

      if (!token) {
        Alert.alert(
          'Sesión no encontrada',
          'Iniciá sesión nuevamente para publicar un trabajo.'
        );
      } else {
        const respuesta = await fetch(`${API_URL}/trabajos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            ubicacion: ubicacion.trim(),
            urgencia: urgencia.toLowerCase(),
            profesionId,
            latitud: latitudTrabajo,
            longitud: longitudTrabajo,
          }),
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
          Alert.alert(
            'Trabajo publicado',
            'Tu trabajo se guardó correctamente.'
          );

          router.push({
            pathname: '/profesionales-disponibles',
            params: {
              trabajoId: String(datos.trabajo.id),
              titulo: titulo.trim(),
              descripcion: descripcion.trim(),
              ubicacion: ubicacion.trim(),
              urgencia,
              profesionId: String(profesionId),
            },
          });
        } else {
          Alert.alert(
            'No se pudo publicar',
            datos.error || 'Ocurrió un error al guardar el trabajo.'
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar con el servidor de Work24.'
      );
    } finally {
      setCargando(false);
    }
  }

  function publicarTrabajo() {
    if (
      titulo.trim() === '' ||
      descripcion.trim() === '' ||
      ubicacion.trim() === '' ||
      urgencia === '' ||
      profesionId === null
    ) {
      Alert.alert(
        'Faltan datos',
        'Completá todos los campos y seleccioná una profesión.'
      );
    } else if (!cargando && !cargandoProfesiones) {
      enviarTrabajo();
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>Nuevo trabajo</Text>

      <Text style={estilos.etiqueta}>
        ¿Qué trabajo necesitás?
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Ej: Reparación eléctrica"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={estilos.etiqueta}>
        Profesión necesaria
      </Text>

      {cargandoProfesiones ? (
        <View style={estilos.cargando}>
          <ActivityIndicator size="large" color="#0000cc" />
          <Text>Cargando profesiones...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={estilos.selector}
          onPress={() => {
            setBusqueda('');
            setSelectorVisible(true);
          }}
        >
          <Text
            style={
              profesionSeleccionada
                ? estilos.textoSeleccion
                : estilos.textoPlaceholder
            }
          >
            {profesionSeleccionada
              ? profesionSeleccionada.nombre
              : 'Buscar o seleccionar una profesión'}
          </Text>

          <Text style={estilos.flecha}>▼</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={selectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={estilos.fondoModal}>
          <View style={estilos.modal}>
            <Text style={estilos.tituloModal}>
              Seleccionar profesión
            </Text>

            <TextInput
              style={estilos.busqueda}
              placeholder="Escribí las primeras letras..."
              value={busqueda}
              onChangeText={setBusqueda}
              autoFocus
            />

            <ScrollView
              style={estilos.resultados}
              keyboardShouldPersistTaps="handled"
            >
              {profesionesFiltradas.length === 0 ? (
                <Text style={estilos.sinResultados}>
                  No se encontraron profesiones.
                </Text>
              ) : (
                profesionesFiltradas.map((profesion) => (
                  <TouchableOpacity
                    key={profesion.id}
                    style={estilos.opcion}
                    onPress={() => seleccionarProfesion(profesion)}
                  >
                    <Text style={estilos.textoOpcion}>
                      {profesion.nombre}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={estilos.cerrar}
              onPress={() => setSelectorVisible(false)}
            >
              <Text style={estilos.textoCerrar}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={estilos.etiqueta}>Descripción</Text>

      <TextInput
        style={estilos.inputGrande}
        placeholder="Contá qué necesitás realizar..."
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Text style={estilos.etiqueta}>Ubicación del trabajo</Text>

      <TextInput
        style={estilos.input}
        placeholder="Buscá una dirección o elegí en el mapa"
        value={ubicacion}
        onChangeText={(texto) => {
          setUbicacion(texto);
          setLatitudTrabajo(null);
          setLongitudTrabajo(null);
        }}
      />

      <TouchableOpacity
        style={estilos.botonMapa}
        onPress={() => setMapaVisible(true)}
      >
        <Text style={estilos.textoBotonMapa}>
          ⌖ Elegir ubicación en el mapa
        </Text>
      </TouchableOpacity>

      {latitudTrabajo !== null && longitudTrabajo !== null && (
        <Text style={estilos.coordenadas}>
          Ubicación seleccionada correctamente.
        </Text>
      )}

      <MapaUbicacion
        visible={mapaVisible}
        onCerrar={() => setMapaVisible(false)}
        onConfirmar={confirmarUbicacion}
        latitudInicial={latitudTrabajo}
        longitudInicial={longitudTrabajo}
        direccionInicial={ubicacion}
      />

      <Text style={estilos.etiqueta}>Urgencia</Text>

      <View style={estilos.urgencias}>
        {['Baja', 'Media', 'Alta'].map((nivel) => (
          <TouchableOpacity
            key={nivel}
            style={
              urgencia === nivel
                ? estilos.urgenciaSeleccionada
                : estilos.urgencia
            }
            onPress={() => setUrgencia(nivel)}
          >
            <Text
              style={
                urgencia === nivel
                  ? estilos.textoUrgenciaSeleccionada
                  : estilos.textoUrgencia
              }
            >
              {nivel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          estilos.boton,
          cargando || cargandoProfesiones || profesiones.length === 0
            ? estilos.botonDeshabilitado
            : null,
        ]}
        onPress={publicarTrabajo}
        disabled={
          cargando ||
          cargandoProfesiones ||
          profesiones.length === 0
        }
      >
        <Text style={estilos.textoBoton}>
          {cargando ? 'Publicando...' : 'Publicar trabajo'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  etiqueta: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  inputGrande: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  selector: {
    borderWidth: 2,
    borderColor: '#0000cc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textoSeleccion: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textoPlaceholder: {
    color: '#777777',
    fontSize: 16,
  },
  flecha: {
    color: '#0000cc',
    fontSize: 17,
  },
  cargando: {
    alignItems: 'center',
    padding: 20,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  tituloModal: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000000',
  },
  busqueda: {
    borderWidth: 2,
    borderColor: '#0000cc',
    borderRadius: 10,
    padding: 13,
    fontSize: 16,
    marginBottom: 12,
  },
  resultados: {
    maxHeight: 350,
  },
  opcion: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  textoOpcion: {
    fontSize: 17,
    color: '#000000',
  },
  sinResultados: {
    textAlign: 'center',
    padding: 20,
    color: '#666666',
    fontSize: 16,
  },
  cerrar: {
    backgroundColor: '#0000cc',
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  textoCerrar: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonMapa: {
    backgroundColor: '#174ea6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  textoBotonMapa: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coordenadas: {
    color: '#08752c',
    fontSize: 13,
    marginBottom: 18,
  },
  urgencias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  urgencia: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  urgenciaSeleccionada: {
    width: '31%',
    backgroundColor: '#0000cc',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  textoUrgencia: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  textoUrgenciaSeleccionada: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  boton: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  botonDeshabilitado: {
    backgroundColor: '#666666',
  },
  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
