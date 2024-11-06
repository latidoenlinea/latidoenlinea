class Vista{
    constructor(reset = false){
        if(reset == true){
            this.main = document.querySelector("main")
            this.body = document.body

            this.agregarCamara("camara", "video-camara")

            this.main.append(this.crearTexto("Tu ritmo cardíaco es: ", "bpmForehead", "bpms"))

            this.body.querySelector('.content').appendChild(this.input({id: "btnIniciar", type: "submit", value: "Iniciar", class: ["botones", "oculto"]}))
            this.btnIniciar = this.body.querySelector('#btnIniciar')
            this.btnIniciar.addEventListener("click", this.btnIniciar_click)

            this.body.querySelector('.content').appendChild(this.input({id: "btnDetener", type: "submit", value: "Detener", class: ["botones", "oculto"]}))
            this.btnDetener = this.body.querySelector('#btnDetener')
            this.btnDetener.addEventListener("click", this.btnDetener_click)
        }
    }

    crearTexto(text, clase, id) {
        const heading = document.createElement("h1")
        heading.textContent = text
        heading.classList.add(clase)
        heading.id = id
        return heading
    }

    input(setup) {
        const input = document.createElement("input")

        if(setup.hasOwnProperty("id")) input.id = setup.id
        if(setup.hasOwnProperty("type")) input.setAttribute("type", setup.type)
        if(setup.hasOwnProperty("placeholder")) input.setAttribute("placeholder", setup.placeholder)
        if(setup.hasOwnProperty("disabled")) input.setAttribute("disabled", setup.disabled)
        if(setup.hasOwnProperty("value")) input.setAttribute("value", setup.value)
        if(setup.hasOwnProperty("class")) // Debe ser un array de cadenas
            for(const clase of setup.class)
                input.classList.add(clase)
        return input
    }

    btnIniciar_click(){
        controlador.iniciarMonitoreo()
        console.log("Monitoreo iniciado")
    }

    btnDetener_click(){
        controlador.detenerMonitoreo()
        console.log("Monitoreo detenido")
    }

    agregarCamara(id, clase){
        const video = document.createElement("video")
        video.classList.add("camara-video")
        video.id = id
        video.classList.add(clase)
        video.autoplay = true
    
        video.addEventListener('play', () => {
            console.log("Video en reproducción")
    
            setInterval(() => {
                controlador.enviarFrame(video)
            }, 1000)
        })
    
        navigator.mediaDevices.getUserMedia({video: true})
            .then(stream => {
                video.srcObject = stream
            })
            .catch((error) => {
                console.error("Error al acceder a la cámara web", error)
                this.mensaje("No se pudo acceder a la cámara web")
            })
    
        this.main.append(video)
    }

    mensaje(texto){
        alert(texto)
    }
}
