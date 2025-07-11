class Controlador {
    constructor(reset = true) {
        if (reset == true) {
            this.monitoreo = false
            this.datosCapturados = []
            this.nombreUsuario = ""
            this.sessionId = this.generateSessionId()
        }
    }

    generateSessionId(){
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }

    async enviarFrame(video) {
        if (video.videoWidth <= 0 || video.videoHeight <= 0) {
            console.error("Las dimensiones del video son inválidas")
            return
        }

        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext("2d")

        if (!context) {
            console.error("No se puede obtener el contexto del canvas")
            return
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const dataURL = canvas.toDataURL("image/jpeg")

        const blob = await (await fetch(dataURL)).blob()
        if (!blob) {
            console.error("No se pudo crear el blob")
            return
        }

        const formData = new FormData()
        formData.append("frame", blob, "frame.jpg")

        try {
            const response = await fetch("https://api-web-xz9e.onrender.com/process_video", {
                method: "POST",
                body: formData
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const data = await response.json()
            console.log(data)

            if (this.monitoreo && data.bpm && typeof data.bpm === "number") {
                const fecha = new Date().toISOString()

                this.datosCapturados.push({
                    nombre: this.nombreUsuario,
                    fecha: fecha,
                    bpm: data.raw_bpm || data.bpm,
                    samples: data.samples || 0
                })
            }
            this.actualizarInterfaz(data)

        } catch (error) {
            console.error("Error al comunicar con la API", error)
            document.querySelector(".bpmForehead").textContent = "Error al comunicar con la API"
            
            this.mostrarError("Error al comunicar con la API")
        }
    }

    actualizarInterfaz(data){
        const bpmTitulo = document.querySelector(".bpmForehead")

        if(!bpmTitulo){
            console.error("Elemento .bpmForehead no encontrado")
            return
        }

        if (data.bpm == "No se detecta el rostro"){
            bpmTitulo.textContent = 'No se detecta el rostro en la imagen'
            bpmTitulo.className = "bpmForehead error"
        } else if (data.bpm == "Estimando..."){
            const progress = data.progress || 0
            bpmTitulo.textContent = `Estimando... ${progress.toFixed(1)}%`
            bpmTitulo.className = "bpmForehead estimando"
        } else if (typeof data.bpm === "number"){
            bpmTitulo.textContent = `BPM: ${data.bpm}`
            bpmTitulo.className = "bpmForehead activo"
        } else if (data.error){
            bpmTitulo.textContent = `Error: ${data.error}`
            bpmTitulo.className = "bpmForehead error"
        } else{
            bpmTitulo.textContent = "Estado: ${data.bpm || 'Procesando...'}"
            bpmTitulo.className = "bpmForehead procesando"
        }

    }

    mostrarError(mensaje){
        const bpmTitulo = document.querySelector(".bpmForehead")
        if(bpmTitulo){
            bpmTitulo.textContent = mensaje
            bpmTitulo.className = "bpmForehead error"
        }
    }

    iniciarMonitoreo() {
        let nombreUsuario = prompt("Por favor, ingrese su nombre completo")

        if(!nombreUsuario || nombreUsuario.trim() === "") {
            alert("Por favor, ingrese su nombre completo")
            return false
        }

        this.nombreUsuario = nombreUsuario.trim()
        this.monitoreo = true
        this.datosCapturados = []

        this.resetearSesion()

        this.capturarDatos()

        console.log("Monitoreo iniciado para:", this.nombreUsuario)
        return true

    }

    detenerMonitoreo() {
        this.monitoreo = false

        if (this.frameInterval){
            clearInterval(this.frameInterval)
            this.frameInterval = null
        }

        console.log("Monitoreo detenido")

        if (this.datosCapturados.length > 0) {
            this.exportarDatos()
        }else{
            alert("No se han capturado datos")
        }
    }

    async resetearSesion(){
        try{
            const formData = new FormData()
            formData.append("session_id", this.sessionId)
            
            await fetch("https://api-web-xz9e.onrender.com/reset_session",{
                method: "POST",
                body: formData
            })

            console.log("Sesión reseteada")
        }catch(error){
            console.error("Error al resetear la sesión", error)
        }
    }

    exportarDatos() {

        if(this.datosCapturados.length == 0){
            alert("No se han capturado datos")
            return
        }

        try{
            const csvContent = this.convertirCSV(this.datosCapturados)
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `datos_bpm_${this.nombreUsuario.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            console.log("Datos exportados correctamente")
        }catch(error){
            console.error("Error al exportar los datos", error)
            alert("Error al exportar los datos")
        }
    }

    convertirCSV(datos) {
        const headers = ["Nombre", "Fecha", "BPM Raw", "Muestras"]
        const csvRows = [headers.join(",")]

        datos.forEach(dato => {
            const row = [
                `"${dato.nombre}"`,
                `"${dato.fecha}"`,
                dato.bpm || '',
                dato.raw_bpm || '',
                dato.samples || ''
            ]
            csvRows.push(row.join(","))
        })
        return csvRows.join("\n")
    }

    async capturarDatos() {
        while (this.monitoreo) {
            const video = document.querySelector("video")
            if (video && video.readyState == 4) {
                await this.enviarFrame(video)
            }
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    limpiarRecursos(){
        this.monitoreo = false
        if(this.frameInterval){
            clearInterval(this.frameInterval)
            this.frameInterval = null
        }
        this.datosCapturados = []
    }
}
