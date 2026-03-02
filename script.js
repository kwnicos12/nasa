/**
 * CONFIGURACIÓN
 */
const API_KEY = "DEMO_KEY"; // Cámbiala por tu key real
const BASE_URL = "https://api.nasa.gov/planetary/apod";
const gallery = document.getElementById("gallery");

// Bloquear fechas futuras
const today = new Date().toISOString().split("T")[0];
document.getElementById("start").max = today;
document.getElementById("end").max = today;

/**
 * LÓGICA DE API
 */
async function fetchData(query = "") {
    toggleLoading(true);
    try {
        const res = await fetch(`${BASE_URL}?api_key=${API_KEY}${query}`);
        if (!res.ok) throw new Error("Error con la NASA");
        const data = await res.json();
        return Array.isArray(data) ? data : [data];
    } catch (err) {
        notify("❌ Error de conexión");
        return [];
    } finally {
        toggleLoading(false);
    }
}

/**
 * NUEVA FUNCIÓN: CARGA ALEATORIA 🎲
 */
async function loadRandom() {
    gallery.dataset.view = "all";
    // Pedimos 12 imágenes al azar
    const data = await fetchData("&count=12");
    renderGallery(data);
    notify("¡12 Maravillas aleatorias! 🌌");
}

/**
 * UI Y RENDERIZADO
 */
function renderGallery(items) {
    gallery.innerHTML = "";
    const imagesOnly = items.filter(item => item.media_type === "image");
    
    if (imagesOnly.length === 0) {
        gallery.innerHTML = "<p style='grid-column:1/-1; text-align:center'>No hay imágenes disponibles.</p>";
        return;
    }
    
    imagesOnly.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${item.url}" alt="${item.title}" loading="lazy">
            </div>
            <div class="card-content">
                <small style="color:var(--primary)">${item.date}</small>
                <h3>${item.title}</h3>
            </div>
        `;
        card.onclick = () => openModal(item);
        gallery.appendChild(card);
    });
}

function openModal(data) {
    const isFav = getFavs().some(f => f.date === data.date);
    const modalBody = document.getElementById("modalBody");
    
    modalBody.innerHTML = `
        <h2 style="margin-bottom:10px">${data.title}</h2>
        <small>${data.date}</small>
        <img src="${data.hdurl || data.url}">
        <p style="margin-bottom:20px; line-height:1.5">${data.explanation}</p>
        <div style="display:flex; gap:10px">
            <button class="btn" style="background:${isFav ? '#ef4444' : '#22c55e'}; color:white" 
                onclick='handleFav(${JSON.stringify(data).replace(/'/g, "&apos;")})'>
                ${isFav ? '🗑️ Quitar' : '❤️ Guardar'}
            </button>
            <a href="${data.hdurl || data.url}" target="_blank" class="btn btn-dark">📥 HD</a>
        </div>
    `;
    document.getElementById("modal").classList.add("active");
}

/**
 * FAVORITOS (LÓGICA ORIGINAL MEJORADA)
 */
function getFavs() { return JSON.parse(localStorage.getItem("nasa_storage")) || []; }

function handleFav(item) {
    let favs = getFavs();
    const exists = favs.findIndex(f => f.date === item.date);

    if (exists === -1) {
        favs.push(item);
        notify("Guardado en favoritos ⭐");
    } else {
        favs.splice(exists, 1);
        notify("Eliminado de favoritos");
    }

    localStorage.setItem("nasa_storage", JSON.stringify(favs));
    closeModal();
    if (gallery.dataset.view === "favorites") showFavorites();
}

function showFavorites() {
    gallery.dataset.view = "favorites";
    renderGallery(getFavs());
}

/**
 * UTILIDADES
 */
function closeModal() { document.getElementById("modal").classList.remove("active"); }

function notify(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function toggleLoading(show) {
    const container = document.getElementById("statusContainer");
    container.innerHTML = show ? '<p style="text-align:center; padding:20px; color:var(--primary)">Sincronizando con satélites...</p>' : '';
}

async function loadToday() {
    gallery.dataset.view = "all";
    const data = await fetchData();
    renderGallery(data);
}

async function loadRange() {
    const s = document.getElementById("start").value;
    const e = document.getElementById("end").value;
    if(!s || !e) return notify("Elige las fechas");
    gallery.dataset.view = "all";
    const data = await fetchData(`&start_date=${s}&end_date=${e}`);
    renderGallery(data.reverse());
}

// Inicio
loadToday();