
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    TextInput,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../config/api';
import { obtenerToken } from '../storageSesion';

type Trabajo = {
    id: number;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    urgencia: string;
    estado: string;
    fecha_creacion: string;
    solicitud_finalizada_id: number | null;
};

type ProfesionalContactado = {
    solicitud_id: number;
    solicitud_estado: string;
    fecha_solicitud: string;
    profesional_id: number;
    nombre: string;
    apellido: string;
    descripcion_profesional: string | null;
    estado_disponibilidad: boolean;
    calificacion_id: number | null;
};

export default function DetalleTrabajoScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [profesionales, setProfesionales] = useState<ProfesionalContactado[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [recargar, setRecargar] = useState(0);
    const [calidad, setCalidad] = useState(0);
    const [precio, setPrecio] = useState(0);
    const [trato, setTrato] = useState(0);
    const [comentario, setComentario] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [modalCalificacionVisible, setModalCalificacionVisible] = useState(false);

    useEffect(() => {
        async function cargarDetalle() {
            try {
                const token = await obtenerToken();

                if (!token) {
                    throw new Error('Tu sesión no está disponible. Volvé a iniciar sesión.');
                }

                const respuesta = await fetch(
                    `${API_URL}/trabajos/mis-trabajos/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(datos.error || 'No se pudo cargar el trabajo');
                }

                setTrabajo(datos.trabajo);
                setProfesionales(datos.profesionales || []);

            } catch (e: any) {
                setError(e.message || 'No se pudo conectar con el servidor');
            } finally {
                setCargando(false);
            }
        }

        if (id) {
            cargarDetalle();
        } else {
            setError('No se recibió el identificador del trabajo');
            setCargando(false);
        }
    }, [id, recargar]);


    async function finalizarTrabajo(solicitudId: number) {
        Alert.alert(
            'Finalizar trabajo',
            '¿Confirmás que este profesional fue quien realizó el trabajo? Solo él quedará asociado a la finalización y podrá recibir tu calificación.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            setGuardando(true);
                            const token = await obtenerToken();

                            if (!token) {
                                throw new Error('Tu sesión no está disponible.');
                            }

                            const respuesta = await fetch(
                                `${API_URL}/trabajos/${id}/finalizar`,
                                {
                                    method: 'POST',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ solicitudId })
                                }
                            );

                            const datos = await respuesta.json();

                            if (!respuesta.ok) {
                                throw new Error(datos.error || 'No se pudo finalizar el trabajo.');
                            }

                            setRecargar(valor => valor + 1);
                            setModalCalificacionVisible(true);
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'No se pudo finalizar el trabajo.');
                        } finally {
                            setGuardando(false);
                        }
                    }
                }
            ]
        );
    }

    async function enviarCalificacion() {
        try {
            setGuardando(true);
            const token = await obtenerToken();

            if (!token) {
                throw new Error('Tu sesión no está disponible.');
            }

            const respuesta = await fetch(
                `${API_URL}/trabajos/${id}/calificar`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        calidad,
                        precio,
                        trato,
                        comentario
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo guardar la calificación.');
            }

            setModalCalificacionVisible(false);

            Alert.alert(
                '¡Gracias por tu opinión!',
                'La calificación del profesional se registró correctamente.'
            );

            setComentario('');
            setRecargar(valor => valor + 1);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo guardar la calificación.');
        } finally {
            setGuardando(false);
        }
    }

    function selectorEstrellas(
        titulo: string,
        valor: number,
        cambiar: (numero: number) => void
    ) {
        return (
            <View style={estilos.grupoEstrellas}>
                <Text style={estilos.etiqueta}>{titulo}</Text>
                <View style={estilos.filaEstrellas}>
                    {[1, 2, 3, 4, 5].map(numero => (
                        <TouchableOpacity
                            key={numero}
                            onPress={() => cambiar(numero)}
                            disabled={guardando}
                            style={estilos.botonEstrella}
                        >
                            <Text style={[
                                estilos.estrella,
                                {
                                    color: numero <= valor ? '#FFD700' : '#AAB4C3',
                                    fontWeight: 'bold'
                                }
                            ]}>
                                ★
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    function nombreEstado(estado: string) {
        const nombres: Record<string, string> = {
            pendiente: 'Pendiente',
            aceptado: 'Aceptada',
            en_proceso: 'En curso',
            finalizado: 'Finalizada',
            cancelado: 'Cancelada',
            rechazada: 'Rechazada'
        };

        return nombres[estado] || estado;
    }

    function fechaLegible(fecha: string) {
        const valor = new Date(fecha);

        if (Number.isNaN(valor.getTime())) return 'No disponible';

        return valor.toLocaleDateString('es-AR');
    }

    if (cargando) {
        return (
            <View style={estilos.centro}>
                <ActivityIndicator size="large" color="#0756D8" />
                <Text style={estilos.textoSecundario}>Cargando detalle...</Text>
            </View>
        );
    }

    if (error || !trabajo) {
        return (
            <View style={estilos.centro}>
                <Text style={estilos.error}>{error || 'Trabajo no encontrado'}</Text>
                <TouchableOpacity style={estilos.boton} onPress={() => router.back()}>
                    <Text style={estilos.textoBoton}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={estilos.contenedor}>
            <View style={estilos.encabezado}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={estilos.volver}>‹ Volver a mis trabajos</Text>
                </TouchableOpacity>

                <Text style={estilos.titulo}>Detalle del trabajo</Text>
                <Text style={estilos.subtitulo}>Publicación #{trabajo.id}</Text>
            </View>

            <View style={estilos.tarjeta}>
                <Text style={estilos.tituloTrabajo}>{trabajo.titulo}</Text>

                <Text style={estilos.estadoTrabajo}>
                    Estado: {nombreEstado(trabajo.estado)}
                </Text>

                <Text style={estilos.etiqueta}>Descripción</Text>
                <Text style={estilos.texto}>{trabajo.descripcion}</Text>

                <Text style={estilos.etiqueta}>Ubicación</Text>
                <Text style={estilos.texto}>{trabajo.ubicacion}</Text>

                <Text style={estilos.etiqueta}>Urgencia</Text>
                <Text style={estilos.texto}>{trabajo.urgencia}</Text>

                <Text style={estilos.etiqueta}>Fecha de publicación</Text>
                <Text style={estilos.texto}>
                    {fechaLegible(trabajo.fecha_creacion)}
                </Text>
            </View>

            <View style={estilos.seccion}>
                <Text style={estilos.tituloSeccion}>
                    Profesionales contactados ({profesionales.length})
                </Text>

                {profesionales.length === 0 ? (
                    <View style={estilos.tarjeta}>
                        <Text style={estilos.textoSecundario}>
                            Todavía no contactaste a ningún profesional para este trabajo.
                        </Text>
                    </View>
                ) : (
                    profesionales.map(profesional => (
                        <View key={profesional.solicitud_id} style={estilos.tarjeta}>
                            <Text style={estilos.nombreProfesional}>
                                {profesional.nombre} {profesional.apellido}
                            </Text>

                            {trabajo.solicitud_finalizada_id === profesional.solicitud_id ? (
                                <Text style={estilos.textoCalificado}>
                                    Profesional elegido: trabajo finalizado
                                </Text>
                            ) : (
                                <Text style={estilos.estadoSolicitud}>
                                    Solicitud: {nombreEstado(profesional.solicitud_estado)}
                                </Text>
                            )}

                            <Text style={estilos.textoSecundario}>
                                Contactado el {fechaLegible(profesional.fecha_solicitud)}
                            </Text>

                            {profesional.descripcion_profesional ? (
                                <Text style={estilos.texto}>
                                    {profesional.descripcion_profesional}
                                </Text>
                            ) : null}

                            <Text style={estilos.textoSecundario}>
                                {profesional.estado_disponibilidad
                                    ? 'Disponible'
                                    : 'No disponible actualmente'}
                            </Text>

                            <TouchableOpacity
                                style={estilos.botonSecundario}
                                onPress={() =>
                                    router.push({
                                        pathname: '/perfil-profesional',
                                        params: {
                                            profesionalId: String(profesional.profesional_id)
                                        }
                                    })
                                }
                            >
                                <Text style={estilos.textoBotonSecundario}>
                                    Ver perfil profesional
                                </Text>
                            </TouchableOpacity>

                            {trabajo.estado !== 'finalizado' &&
                                trabajo.estado !== 'cancelado' && (
                                    <TouchableOpacity
                                        style={estilos.botonFinalizar}
                                        onPress={() => finalizarTrabajo(profesional.solicitud_id)}
                                        disabled={guardando}
                                    >
                                        <Text style={estilos.textoBoton}>
                                            Elegir y finalizar con este profesional
                                        </Text>
                                    </TouchableOpacity>
                                )}

                            {trabajo.solicitud_finalizada_id === profesional.solicitud_id && (
                                <>
                                    <Text style={estilos.textoCalificado}>
                                        Profesional elegido para este trabajo
                                    </Text>

                                    {!profesional.calificacion_id && (
                                        <TouchableOpacity
                                            style={estilos.botonFinalizar}
                                            onPress={() => setModalCalificacionVisible(true)}
                                        >
                                            <Text style={estilos.textoBoton}>
                                                Calificar profesional
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

                            {profesional.calificacion_id ? (
                                <Text style={estilos.textoCalificado}>
                                    Este profesional ya fue calificado.
                                </Text>
                            ) : null}
                        </View>
                    ))
                )}


            </View>

            <Modal
                visible={modalCalificacionVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalCalificacionVisible(false)}
            >
                <View style={estilos.fondoModal}>
                    <ScrollView
                        contentContainerStyle={estilos.contenidoModal}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={estilos.tarjetaCalificacion}>
                            <Text style={estilos.tituloSeccion}>
                                Calificar profesional
                            </Text>

                            <Text style={estilos.textoSecundario}>
                                Tu opinión corresponde solamente al profesional que realizó el trabajo.
                            </Text>

                            {selectorEstrellas('Calidad del trabajo', calidad, setCalidad)}
                            {selectorEstrellas('Relación calidad-precio', precio, setPrecio)}
                            {selectorEstrellas('Trato recibido', trato, setTrato)}

                            <Text style={estilos.etiqueta}>
                                Comentario (opcional)
                            </Text>

                            <TextInput
                                style={estilos.campoComentario}
                                value={comentario}
                                onChangeText={setComentario}
                                placeholder="Contanos cómo fue tu experiencia..."
                                multiline
                                maxLength={1000}
                                editable={!guardando}
                            />

                            <TouchableOpacity
                                style={estilos.botonFinalizar}
                                onPress={enviarCalificacion}
                                disabled={guardando || calidad === 0 || precio === 0 || trato === 0}
                            >
                                <Text style={estilos.textoBoton}>
                                    {guardando ? 'Guardando...' : 'Enviar calificación'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={estilos.botonCerrarModal}
                                onPress={() => setModalCalificacionVisible(false)}
                                disabled={guardando}
                            >
                                <Text style={estilos.textoBotonSecundario}>
                                    Ahora no
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: '#F3F6FC'
    },
    encabezado: {
        padding: 20,
        paddingTop: 45,
        backgroundColor: '#FFFFFF'
    },
    volver: {
        color: '#0756D8',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15
    },
    titulo: {
        color: '#14213D',
        fontSize: 26,
        fontWeight: 'bold'
    },
    subtitulo: {
        color: '#64748B',
        marginTop: 5
    },
    tarjeta: {
        backgroundColor: '#FFFFFF',
        margin: 15,
        marginBottom: 0,
        padding: 17,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#DCE4F0'
    },
    tituloTrabajo: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#14213D',
        marginBottom: 10
    },
    estadoTrabajo: {
        color: '#0756D8',
        fontWeight: 'bold',
        marginBottom: 12
    },
    etiqueta: {
        color: '#14213D',
        fontWeight: 'bold',
        marginTop: 12
    },
    texto: {
        color: '#475569',
        fontSize: 15,
        marginTop: 5
    },
    seccion: {
        padding: 15,
        paddingBottom: 30
    },
    tituloSeccion: {
        color: '#14213D',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5
    },
    nombreProfesional: {
        color: '#14213D',
        fontSize: 18,
        fontWeight: 'bold'
    },
    estadoSolicitud: {
        color: '#0756D8',
        fontWeight: 'bold',
        marginTop: 9
    },
    textoSecundario: {
        color: '#64748B',
        marginTop: 8
    },
    botonSecundario: {
        borderWidth: 1,
        borderColor: '#0756D8',
        padding: 12,
        borderRadius: 9,
        marginTop: 14,
        alignItems: 'center'
    },
    textoBotonSecundario: {
        color: '#0756D8',
        fontWeight: 'bold'
    },
    textoCalificado: {
        color: '#16803D',
        fontWeight: 'bold',
        marginTop: 12
    },
    botonFinalizar: {
        backgroundColor: '#0756D8',
        padding: 14,
        borderRadius: 9,
        marginTop: 14,
        alignItems: 'center'
    },
    tarjetaCalificacion: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#DCE4F0'
    },
    fondoModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.60)',
        justifyContent: 'center',
        padding: 18
    },
    contenidoModal: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    botonCerrarModal: {
        padding: 13,
        alignItems: 'center',
        marginTop: 5
    },
    grupoEstrellas: {
        marginTop: 15
    },
    filaEstrellas: {
        flexDirection: 'row',
        marginTop: 6
    },
    botonEstrella: {
        paddingVertical: 4,
        paddingHorizontal: 7
    },
    estrella: {
        fontSize: 34,
        color: '#AAB4C3'
    },
    estrellaActiva: {
        color: '#F5A623'
    },
    campoComentario: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 9,
        padding: 12,
        minHeight: 90,
        textAlignVertical: 'top',
        marginTop: 8,
        color: '#14213D'
    },
    centro: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
        backgroundColor: '#F3F6FC'
    },
    error: {
        color: '#C62828',
        textAlign: 'center'
    },
    boton: {
        backgroundColor: '#0756D8',
        padding: 14,
        borderRadius: 9,
        marginTop: 15
    },
    textoBoton: {
        color: '#FFFFFF',
        fontWeight: 'bold'
    }
});
