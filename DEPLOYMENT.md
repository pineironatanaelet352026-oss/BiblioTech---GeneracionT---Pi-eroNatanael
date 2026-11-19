# Guía de Despliegue en la Nube — BiblioTech (TASK-022)

Esta guía detalla el procedimiento paso a paso para desplegar BiblioTech en producción utilizando servicios gratuitos: **GitHub**, **Neon PostgreSQL**, **Render** (Backend) y **Netlify** (Frontend).

---

## 1. Subir el Repositorio a GitHub

1. Ingresá a [GitHub](https://github.com) e iniciá sesión con tu cuenta.
2. Hacé clic en el botón verde **"New"** para crear un nuevo repositorio.
3. Configuración del repositorio:
   - **Repository name:** `TP-Final-GeneracionT` (o `bibliotech`)
   - **Visibility:** **Public** (Obligatorio para la entrega del bootcamp)
   - **Initialize this repository with:** Deja todas las opciones desmarcadas (sin README, sin .gitignore, sin licencia, ya que los tenemos localmente).
4. Hacé clic en **"Create repository"**.
5. Copiá la URL HTTPS de tu repositorio (ejemplo: `https://github.com/tu-usuario/TP-Final-GeneracionT.git`).
6. En tu terminal local (o avisale al asistente pasándole la URL para que lo ejecute):
   ```bash
   git remote add origin https://github.com/tu-usuario/TP-Final-GeneracionT.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Base de Datos en Neon PostgreSQL

1. Ingresá a [neon.tech](https://neon.tech) y creá una cuenta gratuita (podés ingresar con GitHub).
2. Hacé clic en **"Create a project"**:
   - **Name:** `bibliotech-db`
   - **Postgres version:** 16 (o default)
   - **Region:** Elige la más cercana (ej. US East / Ohio o Frankfurt)
3. Una vez creado el proyecto, hacé clic en **"SQL Editor"** en el menú lateral izquierdo:
   - Abrí el archivo [`backend/src/db/schema.sql`](file:///C:/Users/Camila/OneDrive/Escritorio/carpeta%20para%20pags/TP-Final-GeneracionT/backend/src/db/schema.sql), copiá todo su contenido, pegalo en el editor y hacé clic en **Run**. (Crea tablas, ENUMs y relaciones).
   - Abrí el archivo [`backend/src/db/seed.sql`](file:///C:/Users/Camila/OneDrive/Escritorio/carpeta%20para%20pags/TP-Final-GeneracionT/backend/src/db/seed.sql), copiá todo su contenido, pegalo en el editor y hacé clic en **Run**. (Inserta usuarios de prueba, catálogo inicial y ejemplares).
4. En el Dashboard principal de Neon, copiá la cadena de conexión (**Connection String**):
   - Seleccioná la opción **"Pooled connection"** o direct connection.
   - Formato: `postgresql://usuario:contraseña@ep-xyz.region.aws.neon.tech/bibliotech-db?sslmode=require`
   - *Nota de seguridad:* Guardá esta URL para configurarla en Render; nunca la pegues en archivos públicos ni en commits de Git.

---

## 3. Despliegue del Backend en Render

1. Ingresá a [render.com](https://render.com) e iniciá sesión con GitHub.
2. Hacé clic en **"New +"** → **"Web Service"**.
3. Seleccioná **"Build and deploy from a Git repository"** y elegí tu repositorio `TP-Final-GeneracionT`.
4. Completá el formulario con los siguientes valores exactos:
   - **Name:** `bibliotech-backend`
   - **Region:** US East (Ohio) o la misma que Neon
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. En la sección **"Environment Variables"**, agregá las siguientes variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `JWT_SECRET` = `bibliotech_super_secret_jwt_key_2026_bootcamp` (o cualquier cadena segura)
   - `DATABASE_URL` = *(Pegá aquí la Connection String copiada de Neon)*
   - `FRONTEND_URL` = *(La URL que te asigne Netlify en el paso 4, ej: `https://bibliotech-tu-nombre.netlify.app`)*
6. Hacé clic en **"Deploy Web Service"**.
7. Una vez finalizado el build, Render te dará una URL pública (ejemplo: `https://bibliotech-backend.onrender.com`).
   - Podés verificar que funciona abriendo en tu navegador: `https://bibliotech-backend.onrender.com/api/health`
   - Debe responder: `{"status":"ok","mensaje":"BiblioTech API funcionando correctamente","version":"1.0.0"}`

---

## 4. Despliegue del Frontend en Netlify

1. Ingresá a [netlify.com](https://netlify.com) e iniciá sesión con GitHub.
2. Hacé clic en **"Add new site"** → **"Import an existing project"**.
3. Seleccioná **"GitHub"** y autorizá el acceso al repositorio `TP-Final-GeneracionT`.
4. El archivo [`netlify.toml`](file:///C:/Users/Camila/OneDrive/Escritorio/carpeta%20para%20pags/TP-Final-GeneracionT/netlify.toml) ya preconfigura el build, pero verificá que coincidan estos valores:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (o `frontend/dist`)
5. En la sección **"Environment variables"**, hacé clic en **"Add a variable"**:
   - **Key:** `VITE_API_URL`
   - **Value:** *(La URL pública de Render obtenida en el paso 3, sin barra final, ej: `https://bibliotech-backend.onrender.com`)*
6. Hacé clic en **"Deploy site"**.
7. En pocos segundos, Netlify generará tu dominio público (ejemplo: `https://bibliotech-camila.netlify.app`).
8. **Paso final de sincronización:** Volvé a Render > `bibliotech-backend` > Environment Variables y asegurate de que `FRONTEND_URL` tenga el dominio de Netlify que acabás de obtener (ej. `https://bibliotech-camila.netlify.app`).

---

## 5. Verificación de Funcionamiento en Vivo

1. Ingresá a la URL de Netlify desde cualquier dispositivo o navegador.
2. Probá el inicio de sesión rápido con:
   - **Lector Alumno:** `juan.perez@alumnos.edu` / `password123`
   - **Bibliotecario Admin:** `admin@bibliotech.edu` / `password123`
3. Probá explorar el catálogo, solicitar préstamos, realizar reservas y verificar la respuesta fluida desde la nube.
