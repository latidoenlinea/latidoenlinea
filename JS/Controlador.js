class Controlador {
    constructor(reset = true) {
        if (reset == true) {
            this.monitoreo = false
            this.datosCapturados = []
            this.nombreUsuario = ""
        }
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

            if (this.monitoreo && data.bpmForehead) {
                const fecha = new Date().toISOString()

                this.datosCapturados.push({
                    nombre: this.nombreUsuario,
                    fecha: fecha,
                    bpmForehead: data.bpmForehead
                })
            }

            this.calcularBPM(data.bpm_forehead)

        } catch (error) {
            console.error("Error al comunicar con la API", error)
        }
    }

    calcularBPM(bpmFrente) {
        console.log(bpmFrente)

        if(bpmFrente == null){
            const bpmTitulo = document.querySelector(".bpmForehead")

            bpmTitulo.textContent = 'BPM Frente: Estimando...'
        }

        const bpmForeheadElement = document.querySelector(".bpmForehead")

        if (bpmForeheadElement) {
            bpmForeheadElement.textContent = `BPM Frente: ${bpmFrente}`
        } else {
            console.error("Elemento BPM Frente no encontrado")
        }
    }

    iniciarMonitoreo() {
        this.nombreUsuario = prompt("Por favor, ingrese su nombre completo")
        this.monitoreo = true
        this.capturarDatos()
    }

    detenerMonitoreo() {
        this.monitoreo = false
        this.exportarDatos()
    }

    exportarDatos() {
        fetch("https://api-web-xz9e.onrender.com/guardar_datos_excel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(this.datosCapturados)
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "datos_capturados.csv"
            document.body.appendChild(a)
            a.click()
            a.remove()
        })
        .catch(error => console.log("Error al exportar los datos:", error))
    }

    async capturarDatos() {
        while (this.monitoreo) {
            const video = document.querySelector("video")
            if (video) {
                await this.enviarFrame(video)
            }
            await new Promise(resolve => setTimeout(resolve, 250))
        }
    }
}
