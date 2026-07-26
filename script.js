const formUpload = document.getElementById('form-upload');
const archivoInput = document.getElementById('archivo-input');
const textareaIngles = document.getElementById('texto-ingles');
const textareaEspanol = document.getElementById('texto-espanol');
const textoEspanolContenido = document.getElementById('texto-espanol-contenido');
const btnProcesar = document.getElementById('btn-procesar');
const btnGuardarImagen = document.getElementById('btn-guardar-imagen');
const vistaPrevia = document.getElementById('vista-previa');
const contenedorTexto = document.getElementById('contenedor-texto');
const cardTraduccion = document.getElementById('card-traduccion');

formUpload.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = archivoInput.files[0];

    if (!file) {
        alert('Selecciona un archivo.');
        return;
    }

    const fileType = file.type;
    const reader = new FileReader();

    // Reiniciar interfaz
    vistaPrevia.style.display = 'none';
    contenedorTexto.style.display = 'none';
    cardTraduccion.style.display = 'none';
    btnProcesar.style.display = 'none';
    btnGuardarImagen.style.display = 'none';

    if (fileType === 'text/plain') {
        reader.onload = (event) => {
            textareaIngles.value = event.target.result;
            textareaEspanol.value = ''; 
            contenedorTexto.style.display = 'flex';
            btnProcesar.style.display = 'inline-block';
        };
        reader.readAsText(file);
    } else if (fileType.startsWith('image/')) {
        reader.onload = (event) => {
            vistaPrevia.innerHTML = `<img src="${event.target.result}" class="img-preview">`;
            vistaPrevia.style.display = 'block';
            contenedorTexto.style.display = 'flex';
            btnProcesar.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    } else if (fileType === 'application/pdf') {
        const fileURL = URL.createObjectURL(file);
        vistaPrevia.innerHTML = `<embed src="${fileURL}" type="application/pdf" width="100%" height="400px" />`;
        vistaPrevia.style.display = 'block';
        contenedorTexto.style.display = 'flex';
        btnProcesar.style.display = 'inline-block';
    }
});

// Cuando ustedes terminan de redactar su traducción y hacen clic en Publicar
btnProcesar.addEventListener('click', () => {
    const traduccionUsuario = textareaEspanol.value.trim();

    if (!traduccionUsuario) {
        alert('Por favor, escribe la traducción al español en la casilla correspondiente.');
        return;
    }

    // Insertamos la traducción humana en la tarjeta visual de 111
    textoEspanolContenido.textContent = `"${traduccionUsuario}"`;
    cardTraduccion.style.display = 'flex';
    btnGuardarImagen.style.display = 'inline-block';
});

// Guardar como imagen
btnGuardarImagen.addEventListener('click', () => {
    html2canvas(cardTraduccion, {
        backgroundColor: '#ded9d4',
        scale: 2
    }).then(canvas => {
        const enlace = document.createElement('a');
        enlace.download = 'traduccion-ing2-milo111.png';
        enlace.href = canvas.toDataURL('image/png');
        enlace.click();
    });
});