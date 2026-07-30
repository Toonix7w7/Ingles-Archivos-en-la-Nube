document.addEventListener("DOMContentLoaded", () => {
    const btnTraducirApi = document.getElementById("btn-traducir-api");
    const btnSwitchIdioma = document.getElementById("btn-switch-idioma");
    const btnProcesar = document.getElementById("btn-procesar");
    const btnGuardarImagen = document.getElementById("btn-guardar-imagen");
    const textareaIngles = document.getElementById("texto-ingles");
    const textareaEspanol = document.getElementById("texto-espanol");
    const contenedorResultado = document.getElementById("texto-espanol-contenido");
    const formUpload = document.getElementById("form-upload");
    const archivoInput = document.getElementById("archivo-input");
    const vistaPrevia = document.getElementById("vista-previa");
    const listaArchivosGuardados = document.getElementById("lista-archivos-guardados");

    let repositorioArchivos = [];
    
    // Configuración de idiomas (por defecto: Inglés -> Español)
    let idiomaOrigen = "en";
    let idiomaDestino = "es";

    // ==========================================================================
    // 1. ALTERNAR DIRECCIÓN DE TRADUCCIÓN (EN -> ES / ES -> EN)
    // ==========================================================================
    if (btnSwitchIdioma) {
        btnSwitchIdioma.addEventListener("click", () => {
            if (idiomaOrigen === "en") {
                idiomaOrigen = "es";
                idiomaDestino = "en";
                btnTraducirApi.innerText = "🤖 Traducir (ES ➔ EN)";
            } else {
                idiomaOrigen = "en";
                idiomaDestino = "es";
                btnTraducirApi.innerText = "🤖 Traducir (EN ➔ ES)";
            }
        });
    }

    // ==========================================================================
    // 2. TRADUCCIÓN AUTOMÁTICA CON API (MyMemory API Bidireccional)
    // ==========================================================================
    if (btnTraducirApi) {
        btnTraducirApi.addEventListener("click", async () => {
            const textoOriginal = textareaIngles ? textareaIngles.value.trim() : "";

            if (textoOriginal === "") {
                alert("Por favor ingresa un texto para traducir.");
                return;
            }

            btnTraducirApi.disabled = true;
            const textoOriginalBoton = btnTraducirApi.innerText;
            btnTraducirApi.innerText = "⏳ Traduciendo...";

            try {
                // Petición dinámicamente configurada según el par de idiomas (en|es o es|en)
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoOriginal)}&langpair=${idiomaOrigen}|${idiomaDestino}`;
                const respuesta = await fetch(url);
                const datos = await respuesta.json();

                if (datos && datos.responseData && datos.responseData.translatedText) {
                    textareaEspanol.value = datos.responseData.translatedText;
                    alert("Traducción generada. Por favor revisa y corrige la terminología técnica antes de publicar.");
                } else {
                    alert("No se pudo obtener la traducción de la API. Inténtalo de nuevo.");
                }
            } catch (error) {
                console.error("Error en la traducción:", error);
                alert("Hubo un error al conectar con la API de traducción.");
            } finally {
                btnTraducirApi.disabled = false;
                btnTraducirApi.innerText = textoOriginalBoton;
            }
        });
    }

    // ==========================================================================
    // 3. PUBLICAR TRADUCCIÓN REVISADA
    // ==========================================================================
    if (btnProcesar) {
        btnProcesar.addEventListener("click", () => {
            const textoTraduccion = textareaEspanol ? textareaEspanol.value.trim() : "";

            if (textoTraduccion === "") {
                alert("Por favor asegúrate de revisar o redactar la traducción antes de publicar.");
                return;
            }

            if (contenedorResultado) {
                contenedorResultado.innerText = textoTraduccion;
            }
        });
    }

    // ==========================================================================
    // 4. SUBIDA Y REPOSITORIO DE ARCHIVOS
    // ==========================================================================
    if (archivoInput) {
        archivoInput.addEventListener("change", (e) => {
            const archivo = e.target.files[0];
            if (!archivo) return;

            vistaPrevia.innerHTML = "";

            if (archivo.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement("img");
                    img.src = event.target.result;
                    vistaPrevia.appendChild(img);
                    vistaPrevia.style.display = "flex";
                };
                reader.readAsDataURL(archivo);
            } else {
                vistaPrevia.style.display = "none";
            }
        });
    }

    if (formUpload) {
        formUpload.addEventListener("submit", (e) => {
            e.preventDefault();

            const archivo = archivoInput.files[0];
            if (!archivo) {
                alert("Selecciona un archivo antes de guardar.");
                return;
            }

            const nuevoArchivo = {
                nombre: archivo.name,
                tamaño: (archivo.size / 1024).toFixed(2) + " KB",
                fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            repositorioArchivos.push(nuevoArchivo);
            actualizarListaArchivos();

            archivoInput.value = "";
            vistaPrevia.innerHTML = "";
            vistaPrevia.style.display = "none";
        });
    }

    function actualizarListaArchivos() {
        if (!listaArchivosGuardados) return;

        if (repositorioArchivos.length === 0) {
            listaArchivosGuardados.innerHTML = `<p style="color: var(--texto-secundario); font-size: 0.9rem;">No hay archivos guardados aún.</p>`;
            return;
        }

        listaArchivosGuardados.innerHTML = repositorioArchivos.map(item => `
            <div class="item-archivo-guardado">
                <span>📄 <strong>${item.nombre}</strong> (${item.tamaño})</span>
                <span style="color: var(--texto-secundario); font-size: 0.8rem;">Subido a las ${item.fecha}</span>
            </div>
        `).join("");
    }

    // ==========================================================================
    // 5. EXPORTAR TARJETA COMO IMAGEN
    // ==========================================================================
    if (btnGuardarImagen) {
        btnGuardarImagen.addEventListener("click", () => {
            const cardExportable = document.getElementById("card-traduccion");

            if (typeof html2canvas === "undefined") {
                alert("Error al cargar la librería de exportación.");
                return;
            }

            html2canvas(cardExportable, { scale: 2 }).then(canvas => {
                const enlace = document.createElement("a");
                enlace.download = "traduccion-tecnica-revisada.png";
                enlace.href = canvas.toDataURL("image/png");
                enlace.click();
            });
        });
    }
});