import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
    const [peliculas, setPeliculas] = useState([]);
    const [peliculasFiltradas, setPeliculasFiltradas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [modoDescripcion, setModoDescripcion] = useState(false);
    const [recomendacion, setRecomendacion] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        fetch('/api/peliculas')
            .then(res => res.json())
            .then(data => {
                setPeliculas(data);
                setPeliculasFiltradas(data);
            })
            .catch(err => console.error('Error al obtener películas:', err));
    }, []);

    const handleBuscar = (e) => {
        e.preventDefault();
        const texto = busqueda.toLowerCase();
        const resultado = peliculas.filter(p =>
            p.titulo.toLowerCase().includes(texto) ||
            p.genero.toLowerCase().includes(texto) ||
            p.titulo.toLowerCase().startsWith(texto)
        );
        setPeliculasFiltradas(resultado);
        setRecomendacion('');
    };

    const handleBuscarPorDescripcion = async () => {
        setCargando(true);
        setRecomendacion('Pensando...');
        try {
            const res = await fetch('/api/recomendaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Dame una recomendación basada en esta descripción: ${busqueda}.
                    Usa solo películas de este catálogo: ${peliculas.map(p => p.titulo).join(', ')}.`
                })
            });
            const data = await res.json();
            setRecomendacion(data.recomendacion);

            const seleccionadas = peliculas.filter(p =>
                data.recomendacion.toLowerCase().includes(p.titulo.toLowerCase())
            );

            setPeliculasFiltradas(seleccionadas.length > 0 ? seleccionadas : []);
        } catch (err) {
            console.error('Error con IA:', err);
            setRecomendacion('❌ No se pudo obtener recomendación.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="App">
            <h1 className="titulo">CECYFLIX</h1>

            <form className="buscador" onSubmit={handleBuscar}>
                <input
                    type="text"
                    placeholder={modoDescripcion ? 'Describe la peli que buscas...' : 'Busca por título o género'}
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    required
                />
                <button type="submit">Buscar por texto</button>
                <button
                    type="button"
                    onClick={handleBuscarPorDescripcion}
                    className="btn-ia"
                    disabled={cargando || !busqueda.trim()}
                >
                    {cargando ? 'Consultando IA...' : 'Buscar por descripción'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setModoDescripcion(!modoDescripcion);
                        setBusqueda('');
                        setPeliculasFiltradas(peliculas);
                        setRecomendacion('');
                    }}
                >
                    Cambiar modo
                </button>
            </form>

            {recomendacion && (
                <div className="bloque-recomendaciones">
                    <h2>IA sugiere:</h2>
                    <p>{recomendacion}</p>
                </div>
            )}

            <div className="grid">
                {peliculasFiltradas.map((p) => (
                    <div className="tarjeta" key={p._id || p.titulo}>
                        <img src={p.poster} alt={p.titulo} />
                        <div className="info">
                            <h3>{p.titulo}</h3>
                            <p>{p.genero}</p>
                            <span>{p.descripcion?.slice(0, 60)}...</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
