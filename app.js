const BASE_URL = "https://images-api.nasa.gov/search";
const gallery = document.getElementById("gallery");
const statusContainer = document.getElementById("statusContainer");

const todayStr = new Date().toISOString().split("T")[0];
document.getElementById("start").max = todayStr;
document.getElementById("end").max = todayStr;

async function apiCall(query) {
    showLoading(true);
    try {
        const response = await fetch(`${BASE_URL}?media_type=image&${query}`);
        if (!response.ok) {
            throw new Error("Error en la conexión con la NASA");
        }
        
        const json = await response.json();
        const items = json.collection.items.slice(0, 24); 

        return items.map(item => ({
            title: item.data[0].title,
            date: item.data[0].date_created.split("T")[0],
            url: item.links[0].href,
            hdurl: item.links[0].href,
            explanation: item.data[0].description || "Sin descripción disponible."
        }));
    } catch (error) {
        showToast("🚀 Error de conexión");
        return [];
    } finally {
        showLoading(false);
    }
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 4000);
}

function showLoading(isLoading) {
    if (isLoading) {
        statusContainer.innerHTML = '<div class="loader">📡 Conectando con los servidores de la NASA...</div>';
    } else {
        statusContainer.innerHTML = '';
    }
}

function renderGallery(items) {
    gallery.innerHTML = "";
    if (items.length === 0) {
        gallery.innerHTML = "<p style='text-align:center; grid-column: 1/-1; color:#ef4444; font-weight:bold;'>No se encontraron resultados.</p>";
        return;
    }
    items.forEach(createCard);
}

function createCard(data) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div class="card-img-container">
            <img src="${data.url}" alt="${data.title}" loading="lazy">
        </div>
        <div class="card-content">
            <small>${data.date}</small>
            <h3>${data.title}</h3>
        </div>
    `;
    card.onclick = () => openModal(data);
    gallery.appendChild(card);
}

function openModal(data) {
    const isFavorite = checkIfFavorite(data.date);
    document.getElementById("modalBody").innerHTML = `
        <small style="color:var(--primary)">${data.date}</small>
        <h2 style="margin:10px 0">${data.title}</h2>
        <img src="${data.hdurl || data.url}">
        <p style="line-height:1.6; color:#cbd5e1; margin-bottom:20px">${data.explanation}</p>
        <div style="display:flex; gap:10px">
            <button class="btn" style="background:${isFavorite ? '#ef4444' : '#22c55e'}; color:white" onclick='toggleFavorite(${JSON.stringify(data).replace(/'/g, "&apos;")})'>
                ${isFavorite ? '🗑️ Eliminar de Favoritos' : '❤️ Guardar en Favoritos'}
            </button>
            <a href="${data.hdurl || data.url}" target="_blank" class="btn" style="background:#334155; color:white; text-decoration:none">
                📥 Descargar HD
            </a>
        </div>
    `;
    document.getElementById("modal").classList.add("active");
}

function closeModal() {
    document.getElementById("modal").classList.remove("active");
}

function getFavorites() {
    return JSON.parse(localStorage.getItem("nasa_favs_clean")) || [];
}

function checkIfFavorite(date) {
    return getFavorites().some(f => f.date === date);
}

function toggleFavorite(data) {
    let favs = getFavorites();
    const index = favs.findIndex(f => f.date === data.date);
    
    if (index === -1) {
        favs.push(data);
        showToast("Guardado en favoritos 🚀");
    } else {
        favs.splice(index, 1);
        showToast("Eliminado de favoritos");
    }
    
    localStorage.setItem("nasa_favs_clean", JSON.stringify(favs));
    closeModal();
    
    if (gallery.dataset.view === "favorites") {
        showFavorites();
    }
}

function showFavorites() {
    gallery.dataset.view = "favorites";
    renderGallery(getFavorites());
}

async function loadToday() {
    gallery.dataset.view = "all";
    const data = await apiCall("q=telescope");
    renderGallery(data);
}

async function loadRange() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    
    if (!start || !end) {
        return showToast("Selecciona un rango de fechas");
    }
    
    gallery.dataset.view = "all";
    const startYear = start.split("-")[0];
    const endYear = end.split("-")[0];
    const data = await apiCall(`q=space&year_start=${startYear}&year_end=${endYear}`);
    renderGallery(data);
}

async function loadRandom() {
    gallery.dataset.view = "all";
    const keywords = ["mars", "galaxy", "nebula", "astronaut", "apollo", "earth", "moon"];
    const randomKey = keywords[Math.floor(Math.random() * keywords.length)];
    const data = await apiCall(`q=${randomKey}`);
    renderGallery(data);
    showToast(`🎲 Mostrando: ${randomKey}`);
}

loadToday();