import { useEffect, useMemo, useRef, useState } from 'react';
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
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { API_URL } from '../config/api';

type Punto = {
  latitud: number;
  longitud: number;
  direccion: string;
};

type Resultado = Punto & {
  nombre: string;
};

type Props = {
  visible: boolean;
  onCerrar: () => void;
  onConfirmar: (punto: Punto) => void;
  latitudInicial: number | null;
  longitudInicial: number | null;
  direccionInicial: string;
};

const LATITUD_INICIAL = -34.4586972;
const LONGITUD_INICIAL = -58.9138964;

export default function MapaUbicacion({
  visible,
  onCerrar,
  onConfirmar,
  latitudInicial,
  longitudInicial,
  direccionInicial,
}: Props) {
  const mapa = useRef<WebView>(null);
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [punto, setPunto] = useState<Punto | null>(null);

  const centroLatitud = latitudInicial ?? LATITUD_INICIAL;
  const centroLongitud = longitudInicial ?? LONGITUD_INICIAL;

  useEffect(() => {
    if (visible) {
      setConsulta(direccionInicial);
      setResultados([]);

      if (latitudInicial !== null && longitudInicial !== null) {
        setPunto({
          latitud: latitudInicial,
          longitud: longitudInicial,
          direccion: direccionInicial,
        });
      } else {
        setPunto(null);
      }
    }
  }, [visible, latitudInicial, longitudInicial, direccionInicial]);

  const html = useMemo(() => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html,body,#map {height:100%;width:100%;margin:0;padding:0}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const mapa = L.map('map').setView(
  [${centroLatitud},${centroLongitud}],
  ${latitudInicial !== null ? 16 : 13}
);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  attribution:'&copy; OpenStreetMap contributors'
}).addTo(mapa);

let marcador = null;

function seleccionar(lat,lon,notificar=true) {
  if(marcador) {
    marcador.setLatLng([lat,lon]);
  } else {
    marcador=L.marker([lat,lon]).addTo(mapa);
  }
  mapa.setView([lat,lon],16);
  if(notificar) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      tipo:'punto',
      latitud:lat,
      longitud:lon
    }));
  }
}

mapa.on('click',function(e) {
  seleccionar(e.latlng.lat,e.latlng.lng);
});

window.seleccionarPunto=seleccionar;
</script>
</body>
</html>`, [centroLatitud, centroLongitud, latitudInicial]);

  function moverMapa(latitud: number, longitud: number) {
    mapa.current?.injectJavaScript(
      `window.seleccionarPunto(${latitud},${longitud},false); true;`
    );
  }

  async function buscarDireccion() {
    if (consulta.trim().length < 3) {
      Alert.alert('Dirección incompleta', 'Escribí al menos 3 caracteres.');
    } else {
      setCargando(true);
      setResultados([]);

      try {
        const respuesta = await fetch(
          `${API_URL}/ubicaciones/buscar?q=${encodeURIComponent(consulta.trim())}`
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.error || 'No se pudo buscar la dirección.');
        }

        setResultados(Array.isArray(datos) ? datos : []);

        if (Array.isArray(datos) && datos.length === 0) {
          Alert.alert('Sin resultados', 'Probá con otra dirección.');
        }
      } catch (error) {
        Alert.alert(
          'Error de búsqueda',
          error instanceof Error
            ? error.message
            : 'No se pudo conectar con el servicio de mapas.'
        );
      } finally {
        setCargando(false);
      }
    }
  }

  function elegirResultado(resultado: Resultado) {
    const nuevoPunto = {
      latitud: resultado.latitud,
      longitud: resultado.longitud,
      direccion: resultado.nombre,
    };

    setPunto(nuevoPunto);
    setConsulta(resultado.nombre);
    setResultados([]);
    moverMapa(resultado.latitud, resultado.longitud);
  }

  async function usarUbicacionActual() {
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso denegado',
          'Permití el acceso a la ubicación mientras usás Work24.'
        );
      } else {
        const posicion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const latitud = posicion.coords.latitude;
        const longitud = posicion.coords.longitude;

        setPunto({
          latitud,
          longitud,
          direccion: 'Mi ubicación actual',
        });
        setConsulta('Mi ubicación actual');
        setResultados([]);
        moverMapa(latitud, longitud);
      }
    } catch (error) {
      Alert.alert('Error de ubicación', 'No se pudo obtener tu ubicación.');
    }
  }

  function recibirMensaje(evento: { nativeEvent: { data: string } }) {
    try {
      const datos = JSON.parse(evento.nativeEvent.data);

      if (datos.tipo === 'punto') {
        setPunto({
          latitud: Number(datos.latitud),
          longitud: Number(datos.longitud),
          direccion: 'Punto seleccionado en el mapa',
        });
        setResultados([]);
      }
    } catch (error) {
      // Ignorar mensajes inválidos.
    }
  }

  function confirmar() {
    if (!punto) {
      Alert.alert(
        'Falta seleccionar el lugar',
        'Buscá una dirección, usá tu GPS o tocá el mapa.'
      );
    } else {
      onConfirmar(punto);
      onCerrar();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Elegir ubicación del trabajo</Text>
        <Text style={estilos.instruccion}>
          Buscá una dirección o tocá el mapa para colocar el marcador.
        </Text>

        <View style={estilos.fila}>
          <TextInput
            style={estilos.input}
            placeholder="Ej: Calle San Martín 500, Pilar"
            value={consulta}
            onChangeText={(texto) => {
              setConsulta(texto);
              setResultados([]);
            }}
          />
          <TouchableOpacity
            style={estilos.botonBuscar}
            onPress={buscarDireccion}
            disabled={cargando}
          >
            {cargando
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={estilos.textoBlanco}>Buscar</Text>}
          </TouchableOpacity>
        </View>

        {resultados.length > 0 && (
          <ScrollView style={estilos.resultados}>
            {resultados.map((resultado, indice) => (
              <TouchableOpacity
                key={`${resultado.latitud}-${indice}`}
                style={estilos.resultado}
                onPress={() => elegirResultado(resultado)}
              >
                <Text style={estilos.textoResultado}>
                  {resultado.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={estilos.botonGps}
          onPress={usarUbicacionActual}
        >
          <Text style={estilos.textoBlanco}>
            ◎ Usar mi ubicación actual
          </Text>
        </TouchableOpacity>

        <View style={estilos.mapa}>
          <WebView
            ref={mapa}
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={recibirMensaje}
            style={estilos.webview}
          />
        </View>

        <Text style={estilos.atribucion}>
          © OpenStreetMap contributors
        </Text>

        <Text style={estilos.direccion}>
          {punto
            ? `Seleccionado: ${punto.direccion}`
            : 'Todavía no seleccionaste una ubicación.'}
        </Text>

        <View style={estilos.fila}>
          <TouchableOpacity
            style={estilos.cancelar}
            onPress={onCerrar}
          >
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.confirmar}
            onPress={confirmar}
          >
            <Text style={estilos.textoBlanco}>Confirmar ubicación</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    paddingTop: 38,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  instruccion: {
    color: '#444444',
    fontSize: 14,
    marginBottom: 10,
  },
  fila: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#777777',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  botonBuscar: {
    backgroundColor: '#0000cc',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBlanco: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultados: {
    maxHeight: 125,
    borderWidth: 1,
    borderColor: '#cccccc',
    marginBottom: 8,
  },
  resultado: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  textoResultado: {
    color: '#111111',
    fontSize: 13,
  },
  botonGps: {
    backgroundColor: '#174ea6',
    padding: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  mapa: {
    flex: 1,
    minHeight: 260,
    borderWidth: 1,
    borderColor: '#bbbbbb',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#eeeeee',
  },
  atribucion: {
    color: '#555555',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 3,
  },
  direccion: {
    color: '#111111',
    fontSize: 13,
    marginVertical: 7,
  },
  cancelar: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 8,
    alignItems: 'center',
  },
  textoCancelar: {
    color: '#222222',
    fontWeight: 'bold',
  },
  confirmar: {
    flex: 2,
    padding: 14,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
  },
});
