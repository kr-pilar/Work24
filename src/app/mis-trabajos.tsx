
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { router } from 'expo-router';
import { API_URL } from '../config/api';
import {
    obtenerToken,
    cerrarSesion
} from '../storageSesion';

type Usuario = {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    tipo: string;
    dni?: string;
};

type Trabajo = {
    id: number;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    urgencia: string;
    estado: string;
    fecha_creacion: string;
};

type Filtro =
    | 'todos'
    | 'pendiente'
    | 'curso'
    | 'finalizado'
    | 'cancelado';

const filtros: { id: Filtro; nombre: string }[] = [
    { id: 'todos', nombre: 'Todos' },
    { id: 'pendiente', nombre: 'Pendientes' },
    { id: 'curso', nombre: 'En curso' },
    { id: 'finalizado', nombre: 'Finalizados' },
    { id: 'cancelado', nombre: 'Cancelados' }
];

function perteneceAlFiltro(estado: string, filtro: Filtro) {
    if (filtro === 'todos') return true;

    if (filtro === 'curso') {
        return estado === 'aceptado' || estado === 'en_proceso';
    }

    return estado === filtro;
}

function nombreEstado(estado: string) {
    const nombres: Record<string, string> = {
        pendiente: 'Pendiente',
        aceptado: 'Aceptado',
        en_proceso: 'En curso',
        finalizado: 'Finalizado',
        cancelado: 'Cancelado'
    };

    return nombres[estado] || estado;
}

function colorEstado(estado: string) {
    if (estado === 'finalizado') return '#15803D';
    if (estado === 'cancelado') return '#B91C1C';
    if (estado === 'aceptado' || estado === 'en_proceso') {
        return '#0756D8';
    }

    return '#A16207';
}

export default function MiPerfilCliente() {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [filtro, setFiltro] = useState<Filtro>('todos');
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [errorPerfil, setErrorPerfil] = useState('');
    const [errorTrabajos, setErrorTrabajos] = useState('');

    const cargarDatos = useCallback(async () => {
        try {
            setErrorPerfil('');
            setErrorTrabajos('');

            const token = await obtenerToken();

            if (!token) {
                setErrorPerfil(
                    'Tu sesión no está disponible. Volvé a iniciar sesión.'
                );
                setTrabajos([]);
                setUsuario(null);
                return;
            }

            const encabezados = {
                Authorization: `Bearer ${token}`
            };

            const [respuestaPerfil, respuestaTrabajos] = await Promise.all([
                fetch(`${API_URL}/auth/perfil`, {
                    method: 'GET',
                    headers: encabezados
                }),
                fetch(`${API_URL}/trabajos/mis-trabajos`, {
                    method: 'GET',
                    headers: encabezados
                })
            ]);

            const datosPerfil = await respuestaPerfil.json();
            const datosTrabajos = await respuestaTrabajos.json();

            if (!respuestaPerfil.ok) {
                throw new Error(
                    datosPerfil.error || 'No se pudieron cargar tus datos'
                );
            }

            setUsuario(datosPerfil.usuario);

            if (respuestaTrabajos.ok) {
                setTrabajos(
                    Array.isArray(datosTrabajos.trabajos)
                        ? datosTrabajos.trabajos
                        : []
                );
            } else {
                setErrorTrabajos(
                    datosTrabajos.error || 'No se pudieron cargar tus trabajos'
                );
            }

        } catch (e: any) {
            setErrorPerfil(
                e.message || 'No se pudo conectar con el servidor'
            );
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const trabajosFiltrados = trabajos.filter(trabajo =>
        perteneceAlFiltro(trabajo.estado, filtro)
    );

    function abrirDetalle(trabajo: Trabajo) {
        router.push({
            pathname: '/detalle-trabajo',
            params: { id: String(trabajo.id) }
        });
    }

    function fechaLegible(fecha: string) {
        const valor = new Date(fecha);

        if (Number.isNaN(valor.getTime())) {
            return 'Fecha no disponible';
        }

        return valor.toLocaleDateString('es-AR');
    }

    function confirmarCerrarSesion() {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que querés cerrar tu sesión de Work24?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await cerrarSesion();
                        router.replace('/');
                    }
                }
            ]
        );
    }

    if (cargando) {
        return (
            <View style={estilos.centro}>
                <ActivityIndicator size="large" color="#0756D8" />
                <Text style={estilos.mensaje}>
                    Cargando tu perfil...
                </Text>
            </View>
        );
    }

    if (errorPerfil) {
        return (
            <View style={estilos.centro}>
                <Text style={estilos.error}>
                    {errorPerfil}
                </Text>

                <TouchableOpacity
                    style={estilos.boton}
                    onPress={() => {
                        setCargando(true);
                        cargarDatos();
                    }}
                >
                    <Text style={estilos.textoBoton}>
                        Reintentar
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={estilos.contenedor}
            contentContainerStyle={estilos.contenido}
            refreshControl={
                <RefreshControl
                    refreshing={actualizando}
                    onRefresh={() => {
                        setActualizando(true);
                        cargarDatos();
                    }}
                />
            }
        >
            <View style={estilos.encabezado}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={estilos.volver}>
                        ‹ Volver
                    </Text>
                </TouchableOpacity>

                <Text style={estilos.titulo}>
                    Mi perfil
                </Text>

                <Text style={estilos.subtitulo}>
                    Administrá tu cuenta y consultá tus trabajos
                </Text>
            </View>

            {usuario && (
                <View style={estilos.tarjetaPerfil}>
                    <View style={estilos.avatar}>
                        <Text style={estilos.avatarTexto}>
                            {usuario.nombre?.charAt(0).toUpperCase()}
                            {usuario.apellido?.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    <Text style={estilos.nombre}>
                        {usuario.nombre} {usuario.apellido}
                    </Text>

                    <View style={estilos.etiquetaCliente}>
                        <Text style={estilos.textoEtiqueta}>
                            CLIENTE WORK24
                        </Text>
                    </View>

                    <View style={estilos.separador} />

                    <View style={estilos.datoPerfil}>
                        <Text style={estilos.iconoDato}>✉️</Text>
                        <View style={estilos.datoContenido}>
                            <Text style={estilos.etiquetaDato}>
                                Correo electrónico
                            </Text>
                            <Text style={estilos.valorDato}>
                                {usuario.email}
                            </Text>
                        </View>
                    </View>

                    <View style={estilos.datoPerfil}>
                        <Text style={estilos.iconoDato}>📱</Text>
                        <View style={estilos.datoContenido}>
                            <Text style={estilos.etiquetaDato}>
                                Teléfono
                            </Text>
                            <Text style={estilos.valorDato}>
                                {usuario.telefono || 'No informado'}
                            </Text>
                        </View>
                    </View>

                    <View style={estilos.datoPerfil}>
                        <Text style={estilos.iconoDato}>🪪</Text>
                        <View style={estilos.datoContenido}>
                            <Text style={estilos.etiquetaDato}>
                                DNI
                            </Text>
                            <Text style={estilos.valorDato}>
                                {usuario.dni || 'No informado'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={estilos.botonCerrarSesion}
                        onPress={confirmarCerrarSesion}
                    >
                        <Text style={estilos.textoCerrarSesion}>
                            Cerrar sesión
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={estilos.seccionTrabajos}>
                <Text style={estilos.tituloSeccion}>
                    Mis trabajos
                </Text>

                <Text style={estilos.descripcionSeccion}>
                    Consultá tus publicaciones, solicitudes y trabajos anteriores.
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={estilos.filtros}
                contentContainerStyle={estilos.filtrosContenido}
            >
                {filtros.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            estilos.filtro,
                            filtro === item.id && estilos.filtroActivo
                        ]}
                        onPress={() => setFiltro(item.id)}
                    >
                        <Text
                            style={[
                                estilos.textoFiltro,
                                filtro === item.id && estilos.textoFiltroActivo
                            ]}
                        >
                            {item.nombre}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {errorTrabajos ? (
                <View style={estilos.mensajeErrorTrabajos}>
                    <Text style={estilos.error}>
                        {errorTrabajos}
                    </Text>

                    <TouchableOpacity
                        onPress={() => {
                            setActualizando(true);
                            cargarDatos();
                        }}
                    >
                        <Text style={estilos.verDetalle}>
                            Volver a intentar
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : trabajosFiltrados.length === 0 ? (
                <View style={estilos.vacio}>
                    <Text style={estilos.iconoVacio}>📋</Text>

                    <Text style={estilos.vacioTitulo}>
                        No hay trabajos para mostrar
                    </Text>

                    <Text style={estilos.mensaje}>
                        Cuando publiques un trabajo, aparecerá acá.
                    </Text>

                    <TouchableOpacity
                        style={estilos.boton}
                        onPress={() => router.push('/nuevo-trabajo')}
                    >
                        <Text style={estilos.textoBoton}>
                            + Publicar trabajo
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                trabajosFiltrados.map(trabajo => (
                    <TouchableOpacity
                        key={trabajo.id}
                        style={estilos.tarjeta}
                        onPress={() => abrirDetalle(trabajo)}
                    >
                        <View style={estilos.fila}>
                            <Text style={estilos.trabajoTitulo}>
                                {trabajo.titulo}
                            </Text>

                            <Text
                                style={[
                                    estilos.estado,
                                    {
                                        color: colorEstado(trabajo.estado)
                                    }
                                ]}
                            >
                                {nombreEstado(trabajo.estado)}
                            </Text>
                        </View>

                        <Text
                            style={estilos.descripcionTrabajo}
                            numberOfLines={3}
                        >
                            {trabajo.descripcion}
                        </Text>

                        <Text style={estilos.dato}>
                            📍 {trabajo.ubicacion}
                        </Text>

                        <Text style={estilos.dato}>
                            Urgencia: {trabajo.urgencia}
                        </Text>

                        <Text style={estilos.dato}>
                            Publicado: {fechaLegible(trabajo.fecha_creacion)}
                        </Text>

                        <Text style={estilos.verDetalle}>
                            Ver detalle y profesionales →
                        </Text>
                    </TouchableOpacity>
                ))
            )}

            <View style={estilos.pie}>
                <Text style={estilos.pieTexto}>
                    WORK24 · Tu trabajo, más fácil.
                </Text>
            </View>
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: '#F3F6FC'
    },
    contenido: {
        paddingBottom: 30
    },
    encabezado: {
        padding: 20,
        paddingTop: 45,
        backgroundColor: '#FFFFFF'
    },
    volver: {
        color: '#0756D8',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 15
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#14213D'
    },
    subtitulo: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 5
    },
    tarjetaPerfil: {
        backgroundColor: '#FFFFFF',
        margin: 15,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DCE4F0',
        alignItems: 'center'
    },
    avatar: {
        width: 85,
        height: 85,
        borderRadius: 50,
        backgroundColor: '#0756D8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    avatarTexto: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: 'bold'
    },
    nombre: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#14213D',
        textAlign: 'center'
    },
    etiquetaCliente: {
        backgroundColor: '#E7F0FF',
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 20,
        marginTop: 10
    },
    textoEtiqueta: {
        color: '#0756D8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    separador: {
        width: '100%',
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20
    },
    datoPerfil: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 17
    },
    iconoDato: {
        fontSize: 21,
        width: 40
    },
    datoContenido: {
        flex: 1
    },
    etiquetaDato: {
        color: '#64748B',
        fontSize: 12,
        marginBottom: 3
    },
    valorDato: {
        color: '#14213D',
        fontSize: 15,
        fontWeight: '600'
    },
    botonCerrarSesion: {
        borderWidth: 1,
        borderColor: '#B91C1C',
        padding: 13,
        borderRadius: 9,
        width: '100%',
        alignItems: 'center',
        marginTop: 5
    },
    textoCerrarSesion: {
        color: '#B91C1C',
        fontWeight: 'bold',
        fontSize: 15
    },
    seccionTrabajos: {
        paddingHorizontal: 18,
        marginBottom: 15
    },
    tituloSeccion: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#14213D'
    },
    descripcionSeccion: {
        color: '#64748B',
        fontSize: 14,
        marginTop: 5
    },
    filtros: {
        maxHeight: 60,
        marginBottom: 12
    },
    filtrosContenido: {
        paddingHorizontal: 12,
        alignItems: 'center'
    },
    filtro: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#E8EDF5',
        marginHorizontal: 4
    },
    filtroActivo: {
        backgroundColor: '#0756D8'
    },
    textoFiltro: {
        color: '#334155',
        fontWeight: '600'
    },
    textoFiltroActivo: {
        color: '#FFFFFF'
    },
    tarjeta: {
        backgroundColor: '#FFFFFF',
        padding: 17,
        borderRadius: 13,
        marginHorizontal: 15,
        marginBottom: 13,
        borderWidth: 1,
        borderColor: '#DCE4F0'
    },
    fila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8
    },
    trabajoTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#14213D',
        flex: 1
    },
    estado: {
        fontWeight: 'bold',
        backgroundColor: '#E7F0FF',
        padding: 7,
        borderRadius: 8
    },
    descripcionTrabajo: {
        color: '#475569',
        fontSize: 14,
        marginTop: 12,
        marginBottom: 10
    },
    dato: {
        color: '#64748B',
        fontSize: 13,
        marginTop: 5
    },
    verDetalle: {
        color: '#0756D8',
        fontWeight: 'bold',
        marginTop: 15,
        fontSize: 15
    },
    centro: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
        backgroundColor: '#F3F6FC'
    },
    mensaje: {
        color: '#64748B',
        textAlign: 'center',
        marginTop: 10
    },
    error: {
        color: '#C62828',
        textAlign: 'center',
        marginBottom: 15
    },
    mensajeErrorTrabajos: {
        backgroundColor: '#FFFFFF',
        margin: 15,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center'
    },
    vacio: {
        alignItems: 'center',
        padding: 30,
        marginHorizontal: 15,
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 13
    },
    iconoVacio: {
        fontSize: 38,
        marginBottom: 10
    },
    vacioTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#14213D',
        textAlign: 'center'
    },
    boton: {
        backgroundColor: '#0756D8',
        padding: 14,
        borderRadius: 9,
        marginTop: 18
    },
    textoBoton: {
        color: '#FFFFFF',
        fontWeight: 'bold'
    },
    pie: {
        alignItems: 'center',
        padding: 20
    },
    pieTexto: {
        color: '#94A3B8',
        fontSize: 12
    }
});
