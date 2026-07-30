document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos del DOM
    const btnTraducirApi = document.getElementById("btn-traducir-api");
    const btnSwitchIdioma = document.getElementById("btn-switch-idioma");
    const btnProcesar = document.getElementById("btn-procesar");
    const btnGuardarImagen = document.getElementById("btn-guardar-imagen");
    const textareaIngles = document.getElementById("texto-ingles");
    const textareaEspanol = document.getElementById("texto-espanol");
    const contenedorResultado = document.getElementById("texto-espanol-contenido");
    const cardExportable = document.getElementById("card-traduccion");
    const formUpload = document.getElementById("form-upload");
    const archivoInput = document.getElementById("archivo-input");
    const vistaPrevia = document.getElementById("vista-previa");
    const listaArchivosGuardados = document.getElementById("lista-archivos-guardados");

    let repositorioArchivos = [];
    
    // Configuración de idiomas (por defecto: EN -> ES)
    let idiomaOrigen = "en";
    let idiomaDestino = "es";

    // ==========================================================================
    // 1. ALTERNAR DIRECCIÓN DE TRADUCCIÓN (EN -> ES / ES -> EN)
    // ==========================================================================
    if (btnSwitchIdioma && btnTraducirApi) {
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
                alert("Por favor ingresa o carga un texto para traducir.");
                return;
            }

            btnTraducirApi.disabled = true;
            const textoOriginalBoton = btnTraducirApi.innerText;
            btnTraducirApi.innerText = "⏳ Traduciendo...";

            try {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoOriginal)}&langpair=${idiomaOrigen}|${idiomaDestino}`;
                const respuesta = await fetch(url);
                const datos = await respuesta.json();

                if (datos && datos.responseData && datos.responseData.translatedText) {
                    if (textareaEspanol) {
                        textareaEspanol.value = datos.responseData.translatedText;
                    }
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

            if (cardExportable) {
                cardExportable.style.display = "block";
            }
        });
    }

    // ==========================================================================
    // 4. LECTURA Y PROCESAMIENTO DE ARCHIVOS (.TXT, .PDF, .PNG, .JPEG)
    // ==========================================================================
    if (archivoInput) {
        archivoInput.addEventListener("change", async (e) => {
            const archivo = e.target.files[0];
            if (!archivo || !vistaPrevia) return;

            vistaPrevia.innerHTML = "";
            const nombreArchivo = archivo.name.toLowerCase();

            // A) ARCHIVOS DE TEXTO (.txt)
            if (archivo.type === "text/plain" || nombreArchivo.endsWith(".txt")) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (textareaIngles) textareaIngles.value = event.target.result;
                    vistaPrevia.innerHTML = `<p style="color: #00ff88; font-size: 0.9rem;">✔ Texto de <strong>${archivo.name}</strong> cargado.</p>`;
                    vistaPrevia.style.display = "block";
                };
                reader.readAsText(archivo);
            }

            // B) IMÁGENES (.png, .jpg, .jpeg) VIA OCR (Tesseract.js)
            else if (archivo.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    // Vista previa visual
                    const img = document.createElement("img");
                    img.src = event.target.result;
                    img.style.maxWidth = "100%";
                    img.style.maxHeight = "180px";
                    img.style.borderRadius = "5px";

                    const statusMsg = document.createElement("p");
                    statusMsg.style.cssText = "color: #00e5ff; font-size: 0.85rem; margin-top: 5px;";
                    statusMsg.innerText = "⏳ Extrayendo texto de la imagen (OCR)...";

                    vistaPrevia.innerHTML = "";
                    vistaPrevia.appendChild(img);
                    vistaPrevia.appendChild(statusMsg);
                    vistaPrevia.style.display = "block";

                    try {
                        if (typeof Tesseract === "undefined") {
                            throw new Error("Agrega la librería Tesseract.js en tu HTML.");
                        }
                        const result = await Tesseract.recognize(event.target.result, 'eng+spa');
                        if (textareaIngles) {
                            textareaIngles.value = result.data.text.trim();
                        }
                        statusMsg.style.color = "#00ff88";
                        statusMsg.innerText = "✔ Texto extraído de la imagen correctamente.";
                    } catch (err) {
                        console.error(err);
                        statusMsg.style.color = "#ff4444";
                        statusMsg.innerText = "❌ No se pudo extraer el texto de la imagen.";
                    }
                };
                reader.readAsDataURL(archivo);
            }

            // C) ARCHIVOS DOCUMENTO PDF (.pdf) VIA PDF.js
            else if (archivo.type === "application/pdf" || nombreArchivo.endsWith(".pdf")) {
                vistaPrevia.innerHTML = `<p style="color: #00e5ff; font-size: 0.9rem;">⏳ Extrayendo texto del PDF...</p>`;
                vistaPrevia.style.display = "block";

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        if (typeof pdfjsLib === "undefined") {
                            throw new Error("Agrega la librería PDF.js en tu HTML.");
                        }

                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        
                        const typedarray = new Uint8Array(event.target.result);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        let textoExtraido = "";

                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(" ");
                            textoExtraido += pageText + "\n\n";
                        }

                        if (textareaIngles) {
                            textareaIngles.value = textoExtraido.trim();
                        }
                        vistaPrevia.innerHTML = `<p style="color: #00ff88; font-size: 0.9rem;">✔ Texto cargado (${pdf.numPages} página(s) procesadas).</p>`;
                    } catch (err) {
                        console.error(err);
                        vistaPrevia.innerHTML = `<p style="color: #ff4444; font-size: 0.9rem;">❌ Error al leer el PDF.</p>`;
                    }
                };
                reader.readAsArrayBuffer(archivo);
            }

            // Formato no soportado
            else {
                vistaPrevia.innerHTML = `<p style="color: #ffaa00; font-size: 0.9rem;">⚠️ Formato de archivo no soportado para lectura directa.</p>`;
                vistaPrevia.style.display = "block";
            }
        });
    }

    if (formUpload) {
        formUpload.addEventListener("submit", (e) => {
            e.preventDefault();

            if (!archivoInput || !archivoInput.files[0]) {
                alert("Selecciona un archivo antes de guardar.");
                return;
            }

            const archivo = archivoInput.files[0];

            const nuevoArchivo = {
                nombre: archivo.name,
                tamaño: (archivo.size / 1024).toFixed(2) + " KB",
                fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            repositorioArchivos.push(nuevoArchivo);
            actualizarListaArchivos();

            archivoInput.value = "";
            if (vistaPrevia) {
                vistaPrevia.innerHTML = "";
                vistaPrevia.style.display = "none";
            }
        });
    }

    function actualizarListaArchivos() {
        if (!listaArchivosGuardados) return;

        if (repositorioArchivos.length === 0) {
            listaArchivosGuardados.innerHTML = `<p style="color: #888; font-size: 0.9rem;">No hay archivos guardados aún.</p>`;
            return;
        }

        listaArchivosGuardados.innerHTML = repositorioArchivos.map(item => `
            <div class="item-archivo-guardado" style="padding: 8px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                <span>📄 <strong>${item.nombre}</strong> <small>(${item.tamaño})</small></span>
                <span style="color: #888; font-size: 0.8rem;">${item.fecha}</span>
            </div>
        `).join("");
    }

    // ==========================================================================
    // 5. EXPORTAR TARJETA COMO IMAGEN
    // ==========================================================================
    if (btnGuardarImagen) {
        btnGuardarImagen.addEventListener("click", () => {
            const objetivoExportar = cardExportable || contenedorResultado;

            if (!objetivoExportar) {
                alert("No hay ningún resultado publicado para exportar.");
                return;
            }

            if (typeof html2canvas === "undefined") {
                alert("La librería html2canvas no está disponible en la página.");
                return;
            }

            html2canvas(objetivoExportar, { scale: 2 }).then(canvas => {
                const enlace = document.createElement("a");
                enlace.download = "traduccion-revisada.png";
                enlace.href = canvas.toDataURL("image/png");
                enlace.click();
            });
        });
    }
});