const express = require('express');
const multer = require('multer');
const Datastore = require('nedb-promises');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. BASE DE DATOS LOCAL
const db = Datastore.create({ filename: 'archivos.db', autoload: true });
console.log('🍃 Base de datos interna (.db) cargada con éxito');

// 2. CONFIGURACIÓN DE MULTER
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const nombreUsuario = req.body.nombrePersonalizado ? req.body.nombrePersonalizado.trim() : '';
        let nombreFinal = nombreUsuario !== '' 
            ? nombreUsuario.replace(/[^a-zA-Z0-9-_ ]/g, '') + extension 
            : Date.now() + '-' + file.originalname;
        cb(null, nombreFinal);
    }
});

const upload = multer({ storage: storage });

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// 3. ARCHIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. RUTAS
app.post('/subir', upload.single('archivo'), async (req, res) => {
    if (!req.file) return res.status(400).send('No se seleccionó ningún archivo.');

    try {
        const nuevoArchivo = {
            nombreOriginal: req.file.originalname,
            nombreVirtual: req.file.filename,
            url: `/uploads/${req.file.filename}`,
            categoria: req.body.categoria || 'General',
            fechaSubida: new Date()
        };

        await db.insert(nuevoArchivo);
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Error al guardar el archivo.');
    }
});

app.get('/archivos', async (req, res) => {
    try {
        const archivosDB = await db.find({}).sort({ fechaSubida: -1 });
        const lista = archivosDB.map(file => ({
            nombre: file.nombreVirtual,
            url: file.url,
            categoria: file.categoria
        }));
        res.json(lista);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar archivos' });
    }
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`==================================================`);
});