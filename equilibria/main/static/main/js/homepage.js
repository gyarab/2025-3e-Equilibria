document.addEventListener("DOMContentLoaded", () => {
    particlesJS('particles-js', {
        particles: {
            number: { value: 50 },
            color: { value: '#58a6ff' },
            opacity: { value: 0.5 },
            size: { value: 2 },
            line_linked: { enable: true, distance: 150, color: '#58a6ff', opacity: 0.1 },
            move: { enable: true, speed: 1.5 }
        }
    });

    window.addEventListener("scroll", reveal);
    reveal(); // Spustit jednou při načtení

    window.addEventListener('click', function(event) {
        if (!event.target.closest('.user-menu-container')) {
            var dropdown = document.getElementById("user-dropdown-menu");
            if (dropdown && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    });

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
})

async function initializeGame(){
    const btn = event.currentTarget;
    btn.style.pointerEvents = 'none';
    btn.innerText = 'Startování...';

    try{
        const response = await fetch("/initializeGame/", {
            method: "POST",
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json();

        if (data.status === 'success') {
            window.location.href = `/game/play/${data.game_id}`;
        }
    }catch (error) {
        console.error("Nepodařilo se vytvořit hru:", error);
        alert("Chyba při startu hry. Zkus to znovu.");
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function toggleUserMenu(event){
    event.preventDefault();
    document.getElementById("user-dropdown-menu").classList.toggle("show");
}

function scrollToSection(id) {
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    }

function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}