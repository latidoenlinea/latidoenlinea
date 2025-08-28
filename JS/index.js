window.onload = () => {
    window.vista = new Vista(true)
    window.ajax = new Ajax()
    window.controlador = new Controlador()

    // Manejar el cierre de la ventana emergente
    const closePopup = document.getElementById("closePopup")
    const overlay = document.getElementById("overlay")

    closePopup.addEventListener("click", () => {
        overlay.style.display = "none"
    })
}