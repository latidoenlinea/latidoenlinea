class Ajax {
	constructor(listener = "localhost") {
		this.listener = listener
	}

	post(datos) {
		console.log(datos)

		return new Promise((respuesta, rechazo) => {
			let xhttp = new XMLHttpRequest()

			if(!Object.entries(datos).length)
				rechazo(new Error("Datos inválidos"))
			
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200)
					respuesta(this.responseText)
			}
			xhttp.open("POST", this.listener, true)
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
			xhttp.send(JSON.stringify(datos))
		})
	}
}