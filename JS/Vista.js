class Vista{
    constructor(reset = false){
        if(reset == true){
            this.main = document.querySelector("main")
            this.body = document.body
            this.videoElement = null
            this.btnIniciar = null
            this.btnDetener = null
            this.stream = null
            this.evenListeners = []

            this.inicializarInterfaz()
        }
    }

    inicializarInterfaz(){
        if(this.main){
            this.main.innerHTML = ""
        }

        this.agregarCamara("camara", "video-camara")

        this.main.append(this.crearTexto("Tu ritmo cardíaco es: ", "bpmForehead", "bpms"))

        const botonesContainer = document.createElement("div")
        botonesContainer.className = "botones-container"

        this.btnIniciar = this.input({
            id: "btnIniciar",
            type: "button",
            value: "Iniciar monitoreo",
            class: ["btn", "btn-iniciar"]
        })

        this.btnDetener = this.input({
            id: "btnDetener",
            type: "button",
            value: "Detener monitoreo",
            class: ["btn", "btn-detener"]
        })

        this.btnDetener.disabled = true

        botonesContainer.appendChild(this.btnIniciar)
        botonesContainer.appendChild(this.btnDetener)

        this.body.querySelector(".content").appendChild(botonesContainer)

        this.agregarEventListeners()
    }

    agregarEventListeners(){
        this.limpiearEventListeners()

        const iniciarListener = this.btnIniciar_click.bind(this)
        const detenerListener = this.btnDetener_click.bind(this)

        this.btnIniciar.addEventListener("click", iniciarListener)
        this.btnDetener.addEventListener("click", detenerListener)

        this.evenListeners.push({
            element: this.btnIniciar,
            event: "click",
            handler: iniciarListener
        })

        this.evenListeners.push({
            element: this.btnDetener,
            event: "click",
            handler: detenerListener
        })
    }

    limpiearEventListeners(){
        this.evenListeners.forEach(listener =>{
            listener.element.removeEventListener(listener.event, listener.handler)
        })
        this.evenListeners = []
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
        if(!window.controlador){
            this.mensaje("Error: Controlador no inicializado")
            return
        }

        if(!this.videoElement || !this.stream){
            this.mensaje("Error: Cámara no disponible")
            return
        }

        const iniciado = window.controlador.iniciarMonitoreo()
        
        if(iniciado){
            this.btnIniciar.disabled = true
            this.btnIniciar.classList.add("deshabilitado")
            this.btnDetener.disabled = false
            this.btnDetener.classList.remove("deshabilitado")

            const bpmElement = document.querySelector(".bpmForehead")
            if(bpmElement){
                bpmElement.textContent = "Iniciando monitoreo..."
                bpmElement.className = "bpmForehead iniciando"
            }

            console.log("Monitoreo iniciado desde vista")
        }
    }

    btnDetener_click(){
        if(!window.controlador){
            this.mensaje("Error: Controlador no inicializado")
            return
        }

        window.controlador.detenerMonitoreo()

        this.btnIniciar.disabled = false
        this.btnIniciar.classList.remove("deshabilitado")
        this.btnDetener.disabled = true
        this.btnDetener.classList.add("deshabilitado")

        const bpmElement = document.querySelector(".bpmForehead")
        if(bpmElement){
            bpmElement.textContent = "Monitoreo detenido"
            bpmElement.className = "bpmForehead detenido"
        }
        console.log("Monitoreo detenido desde vista")
    }

    agregarCamara(id, clase){
        const video = document.createElement("video")
        video.classList.add("camara-video")
        video.id = id
        video.classList.add(clase)
        video.autoplay = true
        video.muted = true
        video.playsInline = true

        this.videoElement = video
    
        video.addEventListener("loadedmetadata", () => {
            console.log("Video metadata cargada")
            console.log("Dimensions: ${video.videoWidth}x${video.videoHeight}")
        })

        video.addEventListener("canplay", () => {
            console.log("Video puede reproducirse")
        })

        video.addEventListener("play", () => {
            console.log("Video en reproducción")
        })

        video.addEventListener("error", (e) => {
            console.error("Error en el video: ", e)
            this.mensaje("Error al reproducir el video")
        })

        this.solicitarAccesoCamara(video)

        this.main.append(video)
    }

    async solicitarAccesoCamara(video){
        try{
            const constraints = {
                video: {
                    with: { ideal: 640},
                    height: { ideal: 480},
                    frameRate: { ideal: 30, max: 30},
                    facingMode: "user"
                },
                audio: false
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            this.stream = stream
            video.srcObject = stream

            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play()
                    resolve()
                }
            })
            console.log("Acceso a la cámara concedido")
        
        }catch(error){
            console.error("Error al acceder a la cámara: ", error)

            let mensajeError = "No se pudo acceder a la cámara web"

            if(error.name == "NotAllowedError"){
                mensajeError = "Permiso denegado. Por favor, permita el acceso a la cámara."
            } else if(error.name == "NotFoundError"){
                mensajeError = "No se encontró ninguna cámara disponible."
            } else if(error.name == "NotReadableError"){
                mensajeError = "La cámara está siendo usada por otra aplicación."
        }
        this.mensaje(mensajeError)
        this.mostrarErrorCamara()
        }
    }

    mostrarErrorCamara(){
        const errorDiv = document.createElement("div")
        errorDiv.className = "error-camara"
        errorDiv.innerHTML = `
            <div class="error-icon">📷</div>
            <h3>Error de Cámara</h3>
            <p>No se pudo acceder a la cámara web.</p>
            <button class="btn-reintentar" onclick="window.vista.reiniciarCamara()">
                Reintentar
            </button>
        `

        if(this.videoElement && this.videoElement.parentNode){
            this.videoElement.parentNode.replaceChild(errorDiv, this.videoElement)
        }
    }

    reiniciarCamara(){
        this.limpiarStream()
        this.inicializarInterfaz()
    }

    limpiarStream(){
        if(this.stream){
            this.stream.getTracks().forEach(track => track.stop())
            this.stream = null
        }
    }

    mensaje(texto){
        if("Notification" in window && Notification.permission == "granted") {
            new Notification("Latido en Línea", { 
                body: texto, 
                icon: "IMG/logo.png"
            })
        }
        alert(texto)
    }

    async solicitarPermisoNotificaciones(){
        if("Notification" in window && Notification.permission == "default") {
            await Notification.requestPermission()
        }
    }

    destruir(){
        this.limpiearEventListeners()
        this.limpiarStream()

        if(window.controlador){
            window.controlador.limpiarRecursos()
        }

        console.log("Vista destruida y recursos liberados")
    }


}
