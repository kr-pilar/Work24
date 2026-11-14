
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="registro-cliente"
        options={{
          title: 'Registro de Cliente',
        }}
      />

      <Stack.Screen
        name="registro-profesional"
        options={{
          title: 'Registro de Profesional',
        }}
      />

      <Stack.Screen
        name="login-cliente"
        options={{
          title: 'Iniciar sesión',
        }}
      />

      <Stack.Screen
        name="login-profesional"
        options={{
          title: 'Iniciar sesión',
        }}
      />

      <Stack.Screen
        name="registro-google-cliente"
        options={{
          title: 'Completar registro',
        }}
      />

      <Stack.Screen
        name="registro-google-profesional"
        options={{
          title: 'Completar registro profesional',
        }}
      />

      <Stack.Screen
        name="inicio-cliente"
        options={{
          title: 'Inicio',
        }}
      />

      <Stack.Screen
        name="inicio-profesional"
        options={{
          title: 'Inicio profesional',
        }}
      />
    </Stack>
  );
}
