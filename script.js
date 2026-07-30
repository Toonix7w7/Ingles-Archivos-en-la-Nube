document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos del DOM
    const formUpload = document.getElementById("form-upload");
    const archivoInput = document.getElementById("archivo-input");
    const vistaPrevia = document.getElementById("vista-previa");
    const listaArchivos = document.getElementById("lista-archivos-guardados");
    
    const textoIngles = document.getElementById("texto-ingles");
    const textoEspanol = document.getElementById("texto-espanol");
    const btnTraducir = document.getElementById("btn-traducir-api");
    const btnSwitch = document.getElementById("btn-switch-idioma");
    const btnProcesar = document.getElementById("btn-procesar");
    const cardTraduccion = document.getElementById("card-traduccion");
    const textoEspanolContenido = document.getElementById("texto-espanol-contenido");
    const btnGuardarImagen = document.getElementById("btn-guardar-imagen");

    // Arreglo para almacenar los archivos subidos en memoria
    let archivosGuardados = [];

    // --- 1. MANEJO DE SUBIDA DE ARCHIVOS ---
    if (formUpload) {
        formUpload.addEventListener("submit", (e) => {
            e.preventDefault(); // Evita que la página se recargue

            const archivo = archivoInput.files[0];

            if (!archivo) {
                alert("Por favor selecciona un archivo primero.");
                return;
            }

            // Agregar a la lista interna
            archivosGuardados.push(archivo);
            actualizarListaArchivos();

            // Mostrar vista previa según el tipo
            mostrarVistaPrevia(archivo);

            // Limpiar input
            archivoInput.value = "";
        });
    }

    // Función para renderizar la lista de archivos guardados
    function actualizarListaArchivos() {
        if (!listaArchivos) return;

        if (archivosGuardados.length === 0) {
            listaArchivos.innerHTML = `<p style="color: var(--texto-secundario, #666); font-size: 0.9rem;">No hay archivos guardados aún.</p>`;
            return;
        }

        listaArchivos.innerHTML = ""; // Limpiar lista anterior
        const ul = document.createElement("ul");
        ul.style.listStyle = "none";
        ul.style.padding = "0";

        archivosGuardados.forEach((item, index) => {
            const li = document.createElement("li");
            li.style.padding = "0.5rem 0";
            li.style.borderBottom = "1px solid #ccc";
            li.innerHTML = `📄 <strong>${item.name}</strong> (${(item.size / 1024).toFixed(1)} KB) - <em>${item.type || 'Archivo'}</em>`;
            ul.appendChild(li);
        });

        listaArchivos.appendChild(ul);
    }

    // Función para generar vista previa en pantalla
    function mostrarVistaPrevia(archivo) {
        if (!vistaPrevia) return;
        
        vistaPrevia.style.display = "block";
        vistaPrevia.innerHTML = ""; // Limpiar vista previa previa

        // Si es una imagen
        if (archivo.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                vistaPrevia.innerHTML = `<img src="${e.target.result}" alt="Vista Previa" style="max-width: 100%; max-height: 250px; border-radius: 5px; margin-top: 10px;">`;
            };
            reader.readAsDataURL(archivo);
        } 
        // Si es un archivo de texto
        else if (archivo.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const contenido = e.target.result;
                textoIngles.value = contenido; // Carga el texto en el área de traducción
                vistaPrevia.innerHTML = `<p style="color: green;">✔ Texto cargado correctamente en el área de edición.</p>`;
            };
            reader.readAsText(archivo);
        } 
        // Otros formatos (PDF, etc.)
        else {
            vistaPrevia.innerHTML = `<p style="color: #333;">✔ Archivo <strong>${archivo.name}</strong> recibido y guardado en el repositorio.</p>`;
        }
    }

    // --- 2. TRADUCCIÓN SIMPLE Y PUBLICACIÓN ---
    if (btnTraducir) {
        btnTraducir.addEventListener("click", () => {
            const texto = textoIngles.value.trim();
            if (!texto) {
                alert("Escribe o carga algún texto para traducir.");
                return;
            }
            // Simulación/Borrador de traducción o integración
            textoEspanol.value = "[Traducción/Procesado]: " + texto;
        });
    }

    if (btnProcesar) {
        btnProcesar.addEventListener("click", () => {
            const resultado = textoEspanol.value.trim();
            if (resultado) {
                textoEspanolContenido.innerText = resultado;
                cardTraduccion.style.display = "block";
            } else {
                alert("No hay texto traducido para publicar.");
            }
        });
    }

    // --- 3. EXPORTAR COMO IMAGEN (html2canvas) ---
    if (btnGuardarImagen) {
        btnGuardarImagen.addEventListener("click", () => {
            if (typeof html2canvas === "undefined") {
                alert("La librería html2canvas no se ha cargado. Revisa tu conexión a internet.");
                return;
            }
            html2canvas(cardTraduccion).then(canvas => {
                const link = document.createElement("a");
                link.download = "traduccion-cloud.png";
                link.href = canvas.toDataURL();
                link.click();
            });
        });
    }
});