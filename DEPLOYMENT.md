# 🚀 Guía de Despliegue a Producción

Esta guía te ayudará a desplegar ApuestasPro a producción usando **Vercel**.

## 📋 Pre-requisitos

- [x] Cuenta en [GitHub](https://github.com)
- [x] Cuenta en [Vercel](https://vercel.com)
- [x] Proyecto de [Supabase](https://supabase.com) configurado
- [x] Dominio personalizado (opcional)

## 🎯 Paso a Paso

### 1. Preparar el Repositorio

```bash
# 1. Inicializar git (si no está hecho)
git init
git add .
git commit -m "Initial commit - ApuestasPro PWA"

# 2. Crear repositorio en GitHub
# Ve a https://github.com/new y crea un nuevo repositorio

# 3. Conectar y subir
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

### 2. Configurar Vercel

#### Opción A: Desde Vercel Dashboard
1. Ve a [vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Conecta tu cuenta de GitHub
4. Selecciona tu repositorio
5. Configura variables de entorno (ver abajo)
6. Click **"Deploy"**

#### Opción B: Desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login y desplegar
vercel login
vercel

# Seguir las instrucciones
```

### 3. Variables de Entorno en Vercel

En Vercel Dashboard > Tu Proyecto > Settings > Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

**⚠️ IMPORTANTE:** Copia exactamente las URLs y keys desde tu dashboard de Supabase.

### 4. Configurar Dominio Personalizado

#### En Vercel:
1. Settings > Domains
2. Agregar tu dominio: `tuapp.com`
3. Configurar DNS según las instrucciones

#### En tu DNS:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

### 5. Configurar Supabase para Producción

#### URLs Permitidas:
En Supabase Dashboard > Authentication > URL Configuration:

```bash
# Site URL
https://tu-dominio.com

# Redirect URLs
https://tu-dominio.com/**
https://tu-dominio.vercel.app/**
```

#### RLS y Seguridad:
- ✅ RLS habilitado en todas las tablas
- ✅ Edge Functions desplegadas
- ✅ Políticas de seguridad configuradas

### 6. Probar la Aplicación

#### Funcionalidades a Verificar:
- [x] **Autenticación**: Login/registro funciona
- [x] **OCR**: Subida de imágenes y extracción
- [x] **Feed**: Carga correctamente en móvil
- [x] **Notificaciones**: Permisos y push notifications
- [x] **PWA**: Instalable desde navegador
- [x] **Offline**: Service worker funciona

#### URLs de Prueba:
```bash
https://tu-dominio.com/auth      # Login
https://tu-dominio.com/feed      # Feed público
https://tu-dominio.com/admin     # Panel admin
https://tu-dominio.com/profile   # Perfil usuario
```

### 7. Monitoreo y Mantenimiento

#### Vercel Analytics:
- Habilita Analytics en Vercel
- Monitorea performance y errores

#### Supabase Monitoring:
- Revisa logs en Supabase
- Monitorea uso de la base de datos

#### Updates Automáticos:
```bash
# Cada push a main despliega automáticamente
git add .
git commit -m "Update: nueva funcionalidad"
git push origin main
```

## 🔧 Troubleshooting

### Build Errors
```bash
# Error de TypeScript
npm run build  # Verifica localmente primero

# Error de dependencias  
npm install
npm audit fix
```

### Variables de Entorno
```bash
# Verificar en Vercel Dashboard
# Environment Variables deben estar en TODAS las environments:
# - Production
# - Preview  
# - Development
```

### PWA Issues
```bash
# Service Worker no carga
# Verificar que /public/sw.js esté presente
# Headers configurados en vercel.json
```

### Notificaciones No Funcionan
```bash
# HTTPS requerido para notifications
# Verificar dominio personalizado configurado
# Probar en móvil, no en localhost
```

## 🎉 Resultado Final

Una vez completado tendrás:

- ✅ **App en producción**: `https://tu-dominio.com`
- ✅ **PWA instalable** en móviles
- ✅ **Notificaciones push** funcionando
- ✅ **OCR automático** para tickets
- ✅ **Sistema completo** de gestión de picks
- ✅ **Despliegues automáticos** con cada commit

## 📱 Post-Despliegue

1. **Instalar PWA** en tu móvil desde el navegador
2. **Crear usuario admin** usando tu email
3. **Subir primera apuesta** para probar OCR
4. **Configurar notificaciones** en un dispositivo móvil
5. **Compartir URL** con tus usuarios

---

**🚀 ¡Tu app estará lista para usuarios reales!**