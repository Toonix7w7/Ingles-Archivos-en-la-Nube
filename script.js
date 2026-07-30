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
// 2. TRADUCCIÓN ROBUSTA (A PRUEBA DE FALLOS Y TEXTOS LARGOS)
if (btnTraducirApi) {
    btnTraducirApi.addEventListener("click", async () => {
        const textoOriginal = textareaIngles ? textareaIngles.value.trim() : "";

        if (!textoOriginal) {
            alert("Por favor ingresa o carga un texto antes de traducir.");
            return;
        }

        btnTraducirApi.disabled = true;
        const textoBotonOriginal = btnTraducirApi.innerHTML;
        btnTraducirApi.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Traduciendo...`;

        try {
            // Reemplazar saltos de línea por espacios para evitar errores en la URL
            const textoLimpio = textoOriginal.replace(/\n+/g, " ");

            // Opción 1: API Directa de Traducción (Lingva Translate)
            let url = `https://lingva.ml/api/v1/${idiomaOrigen}/${idiomaDestino}/${encodeURIComponent(textoLimpio)}`;
            
            let respuesta = await fetch(url);
            
            if (respuesta.ok) {
                let datos = await respuesta.json();
                if (datos && datos.translation && textareaEspanol) {
                    textareaEspanol.value = datos.translation;
                    return;
                }
            }

            // Opción 2: Fallback a MyMemory API con email explícito (evita bloqueos de IP)
            const emailFake = "estudiante_dev@gmail.com";
            url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoLimpio.substring(0, 1000))}&langpair=${idiomaOrigen}|${idiomaDestino}&de=${emailFake}`;
            
            respuesta = await fetch(url);
            let datos = await respuesta.json();

            if (datos && datos.responseData && datos.responseData.translatedText && textareaEspanol) {
                textareaEspanol.value = datos.responseData.translatedText;
            } else {
                throw new Error("Respuesta inválida de la API");
            }

        } catch (error) {
            console.error("Error al traducir:", error);
            alert("Ocurrió un inconveniente con el servidor de traducción. Por favor intenta dividiendo el texto o verifica tu conexión.");
        } finally {
            btnTraducirApi.disabled = false;
            btnTraducirApi.innerHTML = textoBotonOriginal;
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
    // EXTRAER TEXTO AUTOMÁTICAMENTE SEGÚN FORMATO (.TXT, .PDF, .PNG, .JPEG)
if (archivoInput) {
    archivoInput.addEventListener("change", async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const nombre = archivo.name.toLowerCase();
        if (vistaPrevia) {
            vistaPrevia.style.display = "block";
            vistaPrevia.innerHTML = `<p style="color: #00e5ff;"><i class="fa-solid fa-spinner fa-spin"></i> Procesando archivo: <strong>${archivo.name}</strong>...</p>`;
        }

        // A) ARCHIVOS DE TEXTO PLANO (.txt)
        if (archivo.type === "text/plain" || nombre.endsWith(".txt")) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (textareaIngles) textareaIngles.value = evt.target.result;
                if (vistaPrevia) vistaPrevia.innerHTML = `<p style="color: #00ff88;">✔ Texto extraído de <strong>${archivo.name}</strong>.</p>`;
            };
            reader.readAsText(archivo);
        }

        // B) DOCUMENTOS PDF (.pdf) - MEJORADO Y BLINDADO
        else if (archivo.type === "application/pdf" || nombre.endsWith(".pdf")) {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    // Configurar Worker de PDF.js
                    if (window['pdfjs-dist/build/pdf']) {
                        window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.workerSrc = 
                            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }

                    const typedarray = new Uint8Array(evt.target.result);
                    
                    // Cargar el documento PDF
                    const loadingTask = pdfjsLib.getDocument({ data: typedarray });
                    const pdf = await loadingTask.promise;
                    let textoCompleto = "";

                    // Recorrer todas las páginas y extraer texto
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(" ");
                            
                        textoCompleto += `--- Página ${i} ---\n` + pageText + "\n\n";
                    }

                    // Verificar si se extrajo texto real o si era una imagen escaneada
                    if (textoCompleto.replace(/--- Página \d+ ---/g, '').trim().length === 0) {
                        if (vistaPrevia) {
                            vistaPrevia.innerHTML = `<p style="color: #ffaa00;">⚠️ El PDF no contiene texto editable (es un documento escaneado o basado en imagen). Prueba copiando y pegando el texto directamente.</p>`;
                        }
                    } else {
                        if (textareaIngles) textareaIngles.value = textoCompleto.trim();
                        if (vistaPrevia) {
                            vistaPrevia.innerHTML = `<p style="color: #00ff88;">✔ PDF procesado exitosamente (${pdf.numPages} página/s).</p>`;
                        }
                    }
                } catch (err) {
                    console.error("Error detallado al leer PDF:", err);
                    if (vistaPrevia) {
                        vistaPrevia.innerHTML = `<p style="color: #ff4444;">❌ Error al leer el PDF. Asegúrate de que el archivo no esté protegido con contraseña.</p>`;
                    }
                }
            };
            reader.readAsArrayBuffer(archivo);
        }

        // C) IMÁGENES (.PNG, .JPG, .JPEG) CON OCR
        else if (archivo.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    if (typeof Tesseract === "undefined") {
                        throw new Error("Tesseract no está disponible.");
                    }
                    if (vistaPrevia) {
                        vistaPrevia.innerHTML = `<p style="color: #00e5ff;"><i class="fa-solid fa-eye"></i> Escaneando texto de la imagen (OCR)...</p>`;
                    }

                    const resultado = await Tesseract.recognize(evt.target.result, 'eng+spa');
                    if (textareaIngles) textareaIngles.value = resultado.data.text.trim();
                    if (vistaPrevia) vistaPrevia.innerHTML = `<p style="color: #00ff88;">✔ Texto extraído de la imagen.</p>`;
                } catch (err) {
                    console.error(err);
                    if (vistaPrevia) vistaPrevia.innerHTML = `<p style="color: #ff4444;">❌ Error al escanear la imagen.</p>`;
                }
            };
            reader.readAsDataURL(archivo);
        }
        else {
            if (vistaPrevia) vistaPrevia.innerHTML = `<p style="color: #ffaa00;">⚠️ Formato de archivo no soportado.</p>`;
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