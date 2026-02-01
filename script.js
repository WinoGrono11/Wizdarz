let db = JSON.parse(localStorage.getItem('spotkania_2026')) || [];

const tMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const sec = document.getElementById(id);
    if(sec) sec.classList.add('active');
    if(event && event.currentTarget.classList.contains('tab-btn')) event.currentTarget.classList.add('active');
}

document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const date = document.getElementById('dateInput').value;
    const sStr = document.getElementById('timeFrom').value;
    const eStr = document.getElementById('timeTo').value;
    const start = tMin(sStr);
    const end = tMin(eStr);

    if (end <= start) return alert("Godzina zakończenia musi być późniejsza!");

    const collision = db.find(m => {
        if (m.date !== date) return false;
        const [exS, exE] = m.time.split(' - ').map(tMin);
        return (start < exE && end > exS);
    });

    if (collision) return alert(`Błąd: Termin nakłada się na inne spotkanie (${collision.time})`);

    db.push({
        id: Date.now(),
        date,
        time: `${sStr} - ${eStr}`,
        startMin: start,
        subject: document.getElementById('subject').value,
        info: document.getElementById('info').value,
        contact: document.getElementById('contact').value,
        color: document.getElementById('color').value
    });

    localStorage.setItem('spotkania_2026', JSON.stringify(db));
    alert("Rezerwacja przyjęta!");
    renderCalendar();
    this.reset();
});

function renderCalendar() {
    const grid = document.getElementById('calendarDisplay');
    if(!grid) return;
    grid.innerHTML = '';
    // Podgląd dla całego stycznia 2026
    for(let i=1; i<=31; i++) {
        const dStr = `2026-01-${i.toString().padStart(2, '0')}`;
        const day = document.createElement('div');
        day.className = 'day';
        day.innerHTML = `<span>${i}</span><div class="dot-container"></div>`;
        const dots = day.querySelector('.dot-container');
        
        db.filter(m => m.date === dStr)
          .sort((a,b) => a.startMin - b.startMin)
          .forEach(m => {
            const dot = document.createElement('div');
            dot.className = 'booked-dot';
            dot.style.backgroundColor = m.color;
            dot.title = `[${m.time}] ${m.subject}`;
            dots.appendChild(dot);
        });
        grid.appendChild(day);
    }
}

function loginAdmin() {
    if(prompt("Hasło autoryzacyjne:") === "admin") {
        showTab('admin-panel');
        renderAdminTable();
    }
}

function renderAdminTable() {
    const body = document.getElementById('adminBody');
    const sorted = [...db].sort((a,b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.startMin - b.startMin);
    
    body.innerHTML = sorted.length === 0 ? '<tr><td colspan="6">System nie zarejestrował jeszcze żadnych zgłoszeń.</td></tr>' : 
    sorted.map(m => `
        <tr>
            <td><strong>${m.date}</strong></td>
            <td>${m.time}</td>
            <td>${m.subject}</td>
            <td>${m.info || '-'}</td>
            <td>${m.contact}</td>
            <td><button onclick="deleteEntry(${m.id})" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:bold;">Usuń</button></td>
        </tr>
    `).join('');
}

function deleteEntry(id) {
    if(confirm("Czy na pewno chcesz trwale usunąć ten rekord?")) {
        db = db.filter(m => m.id !== id);
        localStorage.setItem('spotkania_2026', JSON.stringify(db));
        renderAdminTable(); renderCalendar();
    }
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') return alert("Biblioteka XLSX jeszcze się ładuje. Poczekaj sekundę.");
    const data = db.map(m => ({
        "Data": m.date, "Godzina": m.time, "Temat": m.subject, "Uwagi": m.info, "Kontakt": m.contact
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rezerwacje");
    XLSX.writeFile(wb, "Baza_Spotkan_2026.xlsx");
}

window.onload = renderCalendar;
