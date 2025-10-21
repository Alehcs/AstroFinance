# 🚀 AstroFinance - Aplicación de Gestión Financiera Personal

<div align="center">
  <img src="public/favicon.svg" alt="AstroFinance Logo" width="120" height="120">
  
  [![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-10.0.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  
  **Una aplicación moderna de gestión financiera personal con temática espacial**
  
  [🌐 Demo en Vivo](https://astrofinanceapp.web.app) | [📖 Documentación](#-documentación) | [🚀 Instalación](#-instalación)
</div>

---

## 📋 Tabla de Contenidos

- [🌟 Características](#-características)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [🚀 Instalación](#-instalación)
- [⚙️ Configuración](#️-configuración)
- [📱 Uso de la Aplicación](#-uso-de-la-aplicación)
- [🏗️ Estructura del Proyecto](#️-estructura-del-proyecto)
- [🔧 Scripts Disponibles](#-scripts-disponibles)
- [🚀 Despliegue](#-despliegue)
- [📊 Plan de Firebase](#-plan-de-firebase)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

---

## 🌟 Características

### 💰 **Gestión Financiera Completa**
- **📊 Dashboard** con resumen financiero en tiempo real
- **💳 Transacciones** con categorización automática
- **🎯 Metas de Ahorro** con seguimiento de progreso
- **🏦 Préstamos** con gestión de pagos
- **📈 Análisis** financiero con gráficos interactivos

### 🎨 **Interfaz Moderna**
- **🌌 Temática Espacial** con diseño futurista
- **📱 Diseño Responsivo** para móviles y escritorio
- **🌙 Modo Oscuro** integrado
- **✨ Animaciones** suaves y transiciones elegantes
- **🎭 Avatares Personalizados** con generación automática

### 🔐 **Seguridad y Privacidad**
- **🔑 Autenticación** con Firebase Auth
- **🛡️ Reglas de Seguridad** en Firestore
- **👤 Datos Privados** por usuario
- **🔄 Reset Completo** de datos del usuario

### 🚀 **Funcionalidades Avanzadas**
- **⏰ Detección de Inactividad** con logout automático
- **🔔 Notificaciones** en tiempo real
- **📊 Reportes** detallados de gastos e ingresos
- **🏷️ Etiquetado** por método de pago y banco
- **🔄 Transacciones Recurrentes** (preparado para futuro)

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **⚛️ React 18.2.0** - Biblioteca de interfaz de usuario
- **🎨 Tailwind CSS 3.4.0** - Framework de CSS utilitario
- **⚡ Vite 5.0.0** - Herramienta de construcción rápida
- **🔄 React Router DOM** - Enrutamiento de la aplicación
- **🔥 React Hot Toast** - Notificaciones elegantes
- **📅 date-fns** - Manipulación de fechas
- **🎭 DiceBear Avatars** - Generación de avatares

### **Backend & Servicios**
- **🔥 Firebase 10.0.0** - Plataforma de desarrollo
  - **🔐 Authentication** - Autenticación de usuarios
  - **💾 Firestore** - Base de datos NoSQL
  - **🌐 Hosting** - Alojamiento web
- **☁️ Firebase Cloud Functions** - Funciones serverless (preparado)

### **Herramientas de Desarrollo**
- **📦 npm** - Gestor de paquetes
- **🔍 ESLint** - Linter de código
- **🎯 PostCSS** - Procesador de CSS
- **📝 Git** - Control de versiones

---

## 🚀 Instalación

### **Prerrequisitos**
- **Node.js** 16.0.0 o superior
- **npm** 8.0.0 o superior
- **Git** para clonar el repositorio

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/Alehcs/AstroFinance.git
cd AstroFinance/astrofinance-app
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**
Crear archivo `.env.local` en la raíz del proyecto:
```env
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain_aqui
VITE_FIREBASE_PROJECT_ID=tu_project_id_aqui
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id_aqui
VITE_FIREBASE_APP_ID=tu_app_id_aqui
```

### **4. Ejecutar en Modo Desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

---

## ⚙️ Configuración

### **Firebase Setup**

1. **Crear Proyecto en Firebase Console**
   - Ir a [Firebase Console](https://console.firebase.google.com)
   - Crear nuevo proyecto: "astrofinanceapp"

2. **Configurar Authentication**
   - Habilitar Email/Password
   - Habilitar Google Sign-In

3. **Configurar Firestore**
   - Crear base de datos en modo de producción
   - Configurar reglas de seguridad

4. **Configurar Hosting**
   - Inicializar Firebase Hosting
   - Configurar dominio personalizado (opcional)

### **Estructura de Datos**

#### **Colección: `userFinancials`**
```json
{
  "debitBalance": 1250000,
  "creditLimit": 1000000,
  "usedCredit": 350000,
  "lastUpdated": "timestamp"
}
```

#### **Colección: `transactions`**
```json
{
  "userId": "user_id",
  "type": "income|expense",
  "amount": 50000,
  "description": "Descripción",
  "category": "Categoría",
  "paymentMethod": "Débito|Crédito|Efectivo",
  "bankName": "Banco",
  "date": "timestamp"
}
```

---

## 📱 Uso de la Aplicación

### **🏠 Dashboard Principal**
- **Resumen Financiero**: Saldo actual, cupo disponible de crédito
- **Transacciones Recientes**: Últimas 5 transacciones
- **Acceso Rápido**: Botones para agregar transacciones, préstamos, etc.

### **💰 Gestión de Transacciones**
- **Agregar Transacciones**: Ingresos y gastos con categorización
- **Filtros Avanzados**: Por fecha, categoría, método de pago
- **Historial Completo**: Todas las transacciones con búsqueda

### **🎯 Metas de Ahorro**
- **Crear Metas**: Objetivos financieros con fechas límite
- **Seguimiento**: Progreso visual y estadísticas
- **Contribuciones**: Agregar y retirar dinero de las metas

### **🏦 Gestión de Préstamos**
- **Registrar Préstamos**: Monto, tasa de interés, plazo
- **Pagos**: Realizar pagos y seguimiento del saldo
- **Historial**: Registro completo de pagos

### **📊 Análisis Financiero**
- **Gráficos Interactivos**: Gastos por categoría, tendencias mensuales
- **Reportes**: Resúmenes de ingresos vs gastos
- **Insights**: Recomendaciones basadas en patrones de gasto

### **👤 Perfil de Usuario**
- **Configuración Personal**: Avatar, nombre, preferencias
- **Configuración Financiera**: Balances iniciales
- **Zona de Peligro**: Reset completo de datos

---

## 🏗️ Estructura del Proyecto

```
astrofinance-app/
├── 📁 public/                 # Archivos públicos
│   ├── favicon.svg           # Icono de la aplicación
│   └── _headers              # Headers de seguridad
├── 📁 src/                   # Código fuente
│   ├── 📁 components/        # Componentes reutilizables
│   │   ├── BottomNav.jsx     # Navegación inferior
│   │   ├── Header.jsx        # Encabezado
│   │   ├── TransactionModal.jsx # Modal de transacciones
│   │   └── ...              # Otros componentes
│   ├── 📁 pages/            # Páginas de la aplicación
│   │   ├── HomePage.jsx     # Dashboard principal
│   │   ├── TransactionsPage.jsx # Gestión de transacciones
│   │   ├── SavingsPage.jsx  # Metas de ahorro
│   │   └── ...              # Otras páginas
│   ├── 📁 context/          # Contextos de React
│   │   └── AuthContext.jsx  # Contexto de autenticación
│   ├── 📁 utils/            # Utilidades
│   │   ├── currency.js      # Formateo de moneda
│   │   └── errorHandler.js  # Manejo de errores
│   ├── 📁 hooks/            # Hooks personalizados
│   │   └── useIdleTimer.js  # Timer de inactividad
│   ├── App.jsx              # Componente principal
│   ├── main.jsx             # Punto de entrada
│   └── firebase.js          # Configuración de Firebase
├── 📁 functions/            # Cloud Functions (preparado)
│   ├── src/
│   │   └── index.ts         # Funciones serverless
│   └── package.json
├── 📄 firebase.json         # Configuración de Firebase
├── 📄 firestore.rules       # Reglas de seguridad
├── 📄 firestore.indexes.json # Índices de Firestore
├── 📄 package.json          # Dependencias del proyecto
├── 📄 vite.config.js        # Configuración de Vite
├── 📄 tailwind.config.js    # Configuración de Tailwind
└── 📄 .gitignore           # Archivos a ignorar
```

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Construir para producción
npm run preview          # Vista previa de la construcción
npm run lint             # Ejecutar linter

# Firebase
firebase login           # Iniciar sesión en Firebase
firebase init            # Inicializar proyecto Firebase
firebase deploy          # Desplegar a Firebase Hosting
firebase serve           # Servir localmente con Firebase

# Git
git add .                # Agregar cambios
git commit -m "mensaje"  # Hacer commit
git push origin main     # Subir a GitHub
```

---

## 🚀 Despliegue

### **Despliegue a Firebase Hosting**

1. **Construir la aplicación**
```bash
npm run build
```

2. **Desplegar a Firebase**
```bash
firebase deploy --only "hosting,firestore:rules"
```

3. **Verificar el despliegue**
   - La aplicación estará disponible en: `https://tu-proyecto.web.app`

### **Variables de Entorno en Producción**
- Las variables de entorno se configuran automáticamente desde Firebase
- No es necesario configurar archivos `.env` en producción

---

## 📊 Plan de Firebase

### **✅ Plan Spark (Gratuito) - Actualmente en Uso**

**Límites Generosos:**
- **📖 Lecturas**: 50,000/día
- **✍️ Escrituras**: 20,000/día
- **🗑️ Borrados**: 20,000/día
- **💾 Almacenamiento**: 1GB
- **👥 Usuarios**: Ilimitados
- **🌐 Hosting**: 10GB de transferencia

**Servicios Incluidos:**
- ✅ Firebase Authentication
- ✅ Cloud Firestore
- ✅ Firebase Hosting
- ✅ Firebase Analytics

### **❌ NO Incluido (Requiere Plan Blaze)**
- 🔧 Cloud Functions (preparado para futuro)
- 📁 Cloud Storage (no necesario actualmente)

---

## 🤝 Contribuir

### **¿Cómo Contribuir?**

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

### **Guías de Contribución**
- Sigue las convenciones de código existentes
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación cuando sea necesario
- Usa commits descriptivos

---

## 🐛 Reportar Problemas

Si encuentras algún problema:

1. **Verifica** que no haya sido reportado antes
2. **Crea** un nuevo issue con:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Capturas de pantalla (si aplica)
   - Información del navegador/sistema

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia Apache 2.0** - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Alejandro C. (Alehcs)**
- 🌐 GitHub: [@Alehcs](https://github.com/Alehcs)
- 📧 Email: [tu-email@ejemplo.com]

---

## 🙏 Agradecimientos

- **React Team** por la increíble biblioteca
- **Firebase Team** por la plataforma de desarrollo
- **Tailwind CSS** por el framework de CSS
- **Vite Team** por la herramienta de construcción
- **Comunidad Open Source** por todas las librerías utilizadas

---

<div align="center">
  <p>⭐ Si este proyecto te fue útil, ¡dale una estrella! ⭐</p>
  
  [![GitHub stars](https://img.shields.io/github/stars/Alehcs/AstroFinance?style=social)](https://github.com/Alehcs/AstroFinance)
  [![GitHub forks](https://img.shields.io/github/forks/Alehcs/AstroFinance?style=social)](https://github.com/Alehcs/AstroFinance)
  
  <p>🚀 <strong>AstroFinance</strong> - Tu gestión financiera personal en el espacio 🚀</p>
</div>