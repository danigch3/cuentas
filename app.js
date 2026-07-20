// Botones de pestaña guardados como constante
const botones_pestaña = document.querySelectorAll('.tab')

// Secciones guardados como constante
const secciones = document.querySelectorAll('.seccion')

// Activa la pestaña con el nombre seleccionado
function activar_pestaña(nombre_pestaña) {

    //Busca el nombre por todos los botones
    botones_pestaña.forEach(function(boton) {

        //Compruebo si el data-tab del botón coincide con el que quiero activar
        if (boton.dataset.tab === nombre_pestaña) {
            boton.classList.add('activo') // si coincide pongo el botón como activo
        } else {
            boton.classList.remove('activo') // si no coincide quito el estado de activo
        }

    })

    // Igual para las secciones
    secciones.forEach(function(seccion) {
        
        //id de sección es tab-resumen, nombre es resumen --> comparo con tab+nombrepestaña
        if (seccion.id === 'tab-' + nombre_pestaña) {
            seccion.classList.add('activo')
        } else {
            seccion.classList.remove('activo')
        }

    })

    //Representar historial al cambiar pestaña
    if (nombre_pestaña === 'historial') {
        render_historial()
    }

    //Representar historial al cambiar pestaña
    if (nombre_pestaña === 'clientes') {
        render_clientes()
    }

    //Representar resumen al cambiar pestaña
    if (nombre_pestaña === 'resumen') {
        render_resumen()
    }

    //Cargar configuración al cambiar pestaña
    if (nombre_pestaña === 'config') {
        cargar_config()
    }
}

// Añado listener de clic a cada botón
botones_pestaña.forEach(function(boton) {

    boton.addEventListener('click',function() {

        // Leer valor de data-tab del botón
        const pestaña = boton.dataset.tab

        //Activar pestaña
        activar_pestaña(pestaña)
    })
})

//Funciones auxiliares

//Formatea número como euros
function formato_euro(valor) {
    return valor.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits:2
    }) + '€'
}


//Funciones de fecha
    
//Cálculo del trimestre de la fecha introducida
function getTrimestre(fecha) {
    const mes = new Date(fecha).getMonth() + 1 //getMonth() da 0-11, se suma 1 para tener 1-12 
    if (mes <= 3) return 'T1'
    if (mes <= 6) return 'T2'
    if (mes <= 9) return 'T3' 
    return 'T4'
}

//Cálculo del trimestre actual
function getTrimestreActual() {
    const mes_act = new Date().getMonth() + 1
    if (mes_act <= 3) return 'T1'
    if (mes_act <= 6) return 'T2'
    if (mes_act <= 9) return 'T3' 
    return 'T4'
}

//Formato europeo de fecha
function fecha_formateada(fecha) {
    const partes = fecha.split('-')
    return partes [2] + '/' + partes [1] + '/' + partes [0]  
}


//Sección resumen

function cambiar_año() {
    const año_seleccionado = parseInt(document.getElementById('sel-año').value)
    const año_actual = new Date().getFullYear()

    if (año_seleccionado === año_actual) {
        //Si es el año actual se pone el trimestre actual
        document.getElementById('sel-trim').value = getTrimestreActual()
    } else {
        //Si es otro año poner el año completo
        document.getElementById('sel-trim').value = 'Año'
    }

    //Actualizar resumen
    render_resumen()
}

function años_disponibles() {
    //Extraer valores de los años disponibles
    const datos_años = movimientos.map(function(mov){
        return new Date(mov.fecha).getFullYear()   
    })

    //Eliminar años duplicados
    const años_unicos = Array.from(new Set(datos_años))

    //Ordenar de más a menos reciente
    años_unicos.sort(function(a, b) {return b - a})

    //Año actual si no hay movimientos
    if (años_unicos.length === 0) {
        años_unicos.push(new Date().getFullYear())
    }

    //Opciones del select
    const select = document.getElementById('sel-año')
        select.innerHTML = años_unicos.map(function(año){
            return `<option value="${año}">${año}</option>`
        }).join('')
}

//Cálculos
function calcular_datos (movs, trim, año) {

    //Último día del trimestre seleccionado
    const ultimo_dia_trim = {
        T1: new Date(parseInt(año), 2, 31),
        T2: new Date(parseInt(año), 5, 30),
        T3: new Date(parseInt(año), 8, 30),
        T4: new Date(parseInt(año), 11, 31),
        Año: new Date(parseInt(año), 11, 31),
    }[trim]    

    //Primer día del trimestre
    const fecha_mas_antigua = movs.reduce(function(min, m) {
        const fecha = new Date(m.fecha)
        return fecha < min ? fecha : min
    }, new Date(ultimo_dia_trim))

    if (fecha_mas_antigua.getMonth() <= 2) {fecha_mas_antigua.setMonth(0)
        } else if (fecha_mas_antigua.getMonth() <= 5) {fecha_mas_antigua.setMonth(3)
        } else if (fecha_mas_antigua.getMonth() <= 8) {fecha_mas_antigua.setMonth(6)
        } else {fecha_mas_antigua.setMonth(9)}

    const primer_dia_trim = new Date(
        fecha_mas_antigua.getFullYear(),
        fecha_mas_antigua.getMonth(),
        1
    )

    //Último mes del trimestre
    const ultimo_mes = {T1: 3, T2: 6, T3: 9, T4: 12, año: 12}[trim]

    //Filtro del array movs los movimientos por tipo
    const ingresos = movs.filter(function (m) {return m.operacion === 'ingreso'})
    //Gastos totales para el cálculo del IVA
    const gastos = movs.filter(function(m) {return m.operacion === 'gasto'})
    const gastos_directos = movs.filter(function(m) {return m.operacion === 'gasto' && !m.amortizable})
    const gastos_amortizables = movimientos.filter(function(m) {return m.operacion === 'gasto' && m.amortizable})
    const impuestos = movs.filter(function (m) {return m.operacion === 'impuesto'})

    //Sumo los elementos de cada array filtrado
    const total_ingresos = ingresos.reduce(function(acc, m) {return acc + m.base}, 0)
    const total_gastosdir = gastos_directos.reduce(function(acc, m) {return acc + m.base}, 0)
    const total_cuota = impuestos.filter(function(m){return m.subtipo === 'cuota'}).reduce(function(acc, m) {return acc + m.base}, 0)
    const total_amortizacion = gastos_amortizables.reduce(function(acc, m) {
        const fecha_compra = new Date(m.fecha)
        const uso = m.uso_profesional / 100
        const amortizacion_diaria = m.base * uso / m.años_amort / 365

        //Fin amortizacion
        const fin_amortizacion = new Date(fecha_compra)
        fin_amortizacion.setFullYear(fin_amortizacion.getFullYear() + m.años_amort)

        //La fecha que cojo para calcular la amortizacion hasta el trimestre seleccionado es la más pequeña entre el fin del trimestre o el fin de la amortización
        const fecha_fin = new Date(Math.min(ultimo_dia_trim, fin_amortizacion)) 
        const fecha_inicio = new Date(Math.max(primer_dia_trim, fecha_compra))

        //Si la fecha del trimestre es anterior a la compra, no considerar
        if (fecha_compra > fecha_fin) {return acc}

        //La amortización será la amortización diaria por los días transcurridos hasta la fecha elegida para el calculo
        const dias = Math.floor((fecha_fin - fecha_inicio) / (24 * 60 * 60 * 1000))
        
        return acc + dias * amortizacion_diaria 
    },0)

    const total_gastos = total_gastosdir + total_amortizacion + total_cuota
        
    //IRPF retenido
    const irpf_retenido = ingresos.reduce(function(acc, m) {return acc + m.base * m.irpf/100}, 0)

    //Beneficio acumulado
    const total_beneficio = total_ingresos - total_gastos

    const mod130_real = impuestos
        .filter(function(m) {return m.subtipo === 'irpf_130' && new Date(m.fecha).getMonth() + 1 === ultimo_mes})
        .reduce(function(acc, m) {return acc + m.base}, 0)

    return {
        //Arrays
        ingresos,
        gastos,
        gastos_directos,
        gastos_amortizables,
        impuestos,
        
        //Números
        total_ingresos,
        total_gastosdir,
        total_amortizacion,
        total_cuota,
        total_gastos,
        irpf_retenido,
        total_beneficio,
        mod130_real,
        ultimo_mes

    }
}

function render_resumen() {
    //Lee filtros
    const año = document.getElementById('sel-año').value
    const trim = document.getElementById('sel-trim').value

    //Filtra movimientos por año y trimestre, movimientos es un let creado en el apartado de añadir
    const movs = movimientos.filter(function(mov){
        if (!mov.fecha) return false
        const año_mov = new Date(mov.fecha).getFullYear().toString()
        if (año_mov !== año) return false

        //Si muestra el año completo no se filtra por trimestre
        if (trim === 'Año') return true

        return getTrimestre(mov.fecha) === trim
    })

    const d = calcular_datos(movs, trim, año)

    //IVA repercutido
    const iva_rep = d.ingresos.reduce(function(acc, m){return acc + m.base * m.iva/100}, 0)

    //IVA soportado
    const iva_sop = d.gastos.reduce(function(acc, m) {return acc + m.base * m.iva/100}, 0)

    //IVA neto
    const iva_neto = iva_rep - iva_sop

    //Cobrado neto
    const cobrado_neto = d.total_ingresos - d.irpf_retenido

    //Cuota pagada el último mes del trimestre para el cálculo de la reserva
    const cuota_reserva = d.impuestos
        .filter(function(m) {return m.subtipo === 'cuota' && new Date(m.fecha).getMonth() + 1 === d.ultimo_mes})
        .reduce(function(acc, m) {return acc + m.base}, 0)

    const mod130_estimado = Math.max(0, d.total_beneficio * 0.2 - d.irpf_retenido)

    const mod130 = d.mod130_real > 0 ? d.mod130_real : mod130_estimado
    const contenedor = document.getElementById('res-mod130')

    //Cambio del texto junto a modelo 130
    contenedor.innerHTML = `
          <span class="detalle-label">Modelo 130 ${d.mod130_real > 0 ? 'presentado' : 'estimado'}</span>
          <span class="detalle-naranja" id="res-130">${formato_euro(mod130)}</span>
    
    `

    const mod303 = Math.max(0, iva_neto)

    const beneficio_postimp = d.total_beneficio - d.irpf_retenido - mod130

    //Reserva total
    const reserva = cuota_reserva + mod130_estimado + mod303

    //Presentar valores en pantalla
    document.getElementById('res-ingresos').textContent = formato_euro(d.total_ingresos)
    document.getElementById('res-gastos').textContent = formato_euro(d.total_gastos)
    document.getElementById('res-iva').textContent = formato_euro(iva_neto)
    document.getElementById('res-beneficio').textContent = formato_euro(beneficio_postimp)
    document.getElementById('res-cobrado').textContent = formato_euro(cobrado_neto)
    document.getElementById('res-total-reserva').textContent = formato_euro(reserva)   

    document.getElementById('res-irpf').textContent = formato_euro(d.irpf_retenido)
    document.getElementById('res-ivarep').textContent = formato_euro(iva_rep)
    document.getElementById('res-ivasop').textContent = formato_euro(iva_sop)
    document.getElementById('res-130').textContent = formato_euro(mod130)
    document.getElementById('res-303').textContent = formato_euro(mod303)
    
    //Color del beneficio
    const bnfc = document.getElementById('res-beneficio')
    bnfc.textContent = formato_euro(beneficio_postimp)
    bnfc.className = 'metrica-' + (beneficio_postimp >= 0 ? 'verde' : 'rojo')

    //Seguimiento impuestos pagados
    render_mod130(año)
}

function render_mod130(año) {
    const trim_actual = document.getElementById('sel-trim').value
    const orden = ['T1', 'T2', 'T3', 'T4']
    const contenedor = document.getElementById('res-seguimiento-irpf')
    
    if (trim_actual === 'Año') {
        contenedor.innerHTML = '<div class="vacio">Selecciona un trimestre para ver el cálculo</div>'
        return
    }

    //Acumulado hasta el trimestre seleccionado
    const hasta_indice = orden.indexOf(trim_actual)
    let arrastre = 0

    //Coger todos los movimientos que ha habido este año hasta este trimestre
    const movs = movimientos.filter(function(m) {
        if (!m.fecha) return false
        const año_mov = new Date(m.fecha).getFullYear().toString()
        if (año_mov !== año) return false
        return orden.indexOf(getTrimestre(m.fecha)) <= orden.indexOf(trim_actual)
    })

    const d = calcular_datos(movs, trim_actual, año)

    //Pagos modelo 130 de trimestres anteriores
    const m130_anteriores = movs.filter(function(m) {
        return m.subtipo === 'irpf_130' && orden.indexOf(getTrimestre(m.fecha)) < orden.indexOf(trim_actual)
    }).reduce(function(acc, m) {return acc + m.base}, 0)

    const irpf_adelantado = d.irpf_retenido + m130_anteriores + arrastre 

    //Mostrar solo trimestre seleccionado
    const reduccion = get_reduccion(año)
    const base_reducida = d.total_beneficio * reduccion
    const irpf_teorico = Math.max(0, base_reducida * 0.2)
    const irpf_trimestre =  d.mod130_real > 0 ?  d.mod130_real : Math.max(0, irpf_teorico - irpf_adelantado)
    const color_irpf = irpf_trimestre > 0 ? '#e63946' : '#2a9d5c'
    const color_beneficio = d.total_beneficio < 0 ? '#e63946' : '#2a9d5c'
    
    const texto_pago = (irpf_teorico - irpf_adelantado) < 0
        ? `0 € (arrastre ${formato_euro(Math.abs(irpf_teorico - irpf_adelantado))})` : formato_euro(irpf_trimestre)

    contenedor.innerHTML= `
        <div class="fila-detalle">
            <span class="detalle-label">Ingresos acumulados</span>
            <span class="detalle-verde">${formato_euro(d.total_ingresos)}</span>
        </div>        
        <div class="fila-detalle-no">
            <span class="detalle-label">Gastos acumulados</span>
            <span class="detalle-rojo">${formato_euro(d.total_gastos)}</span>
        </div>
        <div class="fila-detalle-no">
            <span class="detalle-label">· Gastos directos</span>
            <span class="detalle-rojo">${formato_euro(d.total_gastosdir)}</span>
        </div>
        <div class="fila-detalle-no">
            <span class="detalle-label">· Amortizaciones</span>
            <span class="detalle-rojo">${formato_euro(d.total_amortizacion)}</span>
        </div>
        <div class="fila-detalle">
            <span class="detalle-label">· Cuota acumulada</span>
            <span class="detalle-naranja">${formato_euro(d.total_cuota)}</span>
        </div>
        <div class="fila-detalle-no">
            <span class="detalle-label">Rendimiento neto</span>
            <span class="detalle-valor" style="color:${color_beneficio}; border-bottom: none">${formato_euro(d.total_beneficio)}</span>
        </div>
        <div style="border-top: 1.5px solid #e0e0e0; margin: 2px 0;"></div>
        <div class="fila-detalle">
            <span class="detalle-label">IRPF teórico (20%)</span>
            <span class="detalle-valor">${formato_euro(irpf_teorico)}</span>
        </div>    
        <div class="fila-detalle-no">
            <span class="detalle-label">Adelantado</span>
            <span class="detalle-valor">${formato_euro(irpf_adelantado)}</span>
        </div>
        <div class="fila-detalle" style="border-top: 3px solid #e0e0e0; margin-top: 2px; padding-top: 8px;">
            <span class="detalle-label" style="font-weight:bold;">Modelo 130 ${d.mod130_real > 0 ? 'presentado' : '(estimado)'}</span>
            <span class="detalle-valor" style="color:${color_irpf}; font-weight:bold;">${texto_pago}</span>
        </div>
    `
}

// Sección añadir
// Tipo de ingreso seleccionado
let operacion_actual = 'ingreso'

// Carga de movimientos guardados, o array vacío si no hay ninguno
let movimientos = JSON.parse(localStorage.getItem('movimientos'))||[]

// Fecha actual como por defecto
document.getElementById('inp-fecha').value = new Date().toISOString('T')[0]

// Botones acción igual que pestañas
const botones_operacion = document.querySelectorAll('.boton-operacion')

botones_operacion.forEach(function(boton){
    boton.addEventListener('click',function(){
    
        // Leer acción botón pulsado
        operacion = boton.dataset.operacion

        operacion_actual = operacion

        // Resaltar botón activo
        botones_operacion.forEach(function(b){
            b.classList.remove('activo')
        })
        boton.classList.add('activo')

       mostrar_campos()
    })
})

//Mostrar campos según movimiento a añadir
function mostrar_campos(){
    if (operacion_actual === 'ingreso') {
        document.getElementById('campo-irpf').style.display = 'block'
        document.getElementById('campo-iva').style.display = 'block'
        document.getElementById('campo-num').style.display = 'block'
        document.getElementById('campo-cliente').style.display = 'block'
        document.getElementById('campo-subtipo').style.display = 'none'
        document.getElementById('campo-amortizable').style.display = 'none'
        document.getElementById('inp-base').value = ''

    } else if (operacion_actual === 'gasto') {
        document.getElementById('campo-irpf').style.display = 'none'
        document.getElementById('campo-iva').style.display = 'block'
        document.getElementById('campo-num').style.display = 'block'
        document.getElementById('campo-cliente').style.display = 'block'
        document.getElementById('campo-subtipo').style.display = 'none'
        document.getElementById('campo-amortizable').style.display = 'block'
        document.getElementById('inp-base').value = ''

    } else {
        document.getElementById('campo-irpf').style.display = 'none'
        document.getElementById('campo-iva').style.display = 'none'
        document.getElementById('campo-num').style.display = 'none'
        document.getElementById('campo-cliente').style.display = 'none'
        document.getElementById('campo-subtipo').style.display = 'block' 
        document.getElementById('campo-amortizable').style.display = 'none'
        autocompletar_cuota()           
    }
}

// Función para guardar movimiento
document.getElementById('boton-guardar').addEventListener('click',function(){

    // Leer valores formulario
    const concepto = document.getElementById('inp-concepto').value.trim()
    const base = parseFloat(document.getElementById('inp-base').value)
    const fecha = document.getElementById('inp-fecha').value

    // Comprobar campos están rellenos
    if (!concepto) {
        alert('Escribe un concepto')
        return
    }
    if (!base || base <= 0) {
        alert('Introduce una base válida')
        return
    }
    if (!fecha) {
        alert('Selecciona una fecha')
        return
    }

    // Crear objeto movimiento con los datos
    const movimiento = {
        id: modo_edicion || Date.now(), //fecha al pulsar en ms como id único
        operacion: operacion_actual,
        concepto: concepto,
        base: base,
        fecha: fecha,
        iva: operacion_actual !== 'impuesto' ? parseFloat(document.getElementById('inp-iva').value): 0,
        irpf: operacion_actual === 'ingreso' ? parseFloat(document.getElementById('inp-irpf').value) :0,
        num: document.getElementById('inp-num').value.trim(),
        clienteId: document.getElementById('inp-cliente-id').value || null,
        amortizable: operacion_actual === 'gasto' ? document.getElementById('inp-amortizable').checked : false,
        años_amort: document.getElementById('inp-amortizable').checked ? parseInt(document.getElementById('inp-años-amort').value) || 4 : null,
        uso_profesional: document.getElementById('inp-amortizable').checked ? parseFloat(document.getElementById('inp-uso-profesional').value) || 100 : null,
        subtipo: operacion_actual === 'impuesto' ? document.getElementById('inp-subtipo').value : null,

    }

    quitar_cliente()

    // Añadir al array
    if (modo_edicion) {
        //Edición - sobreescribe el movimiento existente
        movimientos = movimientos.map(function(m){
            return m.id === modo_edicion ? movimiento : m
        })
        modo_edicion = null
        document.getElementById('boton-guardar').textContent = 'Guardar movimiento'
        document.getElementById('boton-cancelaredicion').style.display = 'none'
        activar_pestaña('historial')
    } else {
        //Creación
        movimientos.push(movimiento)
    }    

    // Guardar array completo en localStorage como JSON
    localStorage.setItem('movimientos', JSON.stringify(movimientos))

    años_disponibles()

    // Limpiar formulario
    limpiar_movimiento()

    // Avisar usuario
    alert('Guardado')
    render_historial()
})

function limpiar_movimiento() {
    document.getElementById('inp-concepto').value = ''
    document.getElementById('inp-base').value = ''
    document.getElementById('inp-num').value = ''
    document.getElementById('inp-cliente-buscar').value = ''
    document.getElementById('inp-amortizable').checked = false
    document.getElementById('campos-amortizacion').style.display = 'none'
    document.getElementById('inp-años-amort').value = ''
    document.getElementById('inp-uso-profesional').value = '100'
}

// Dibuja el historial en pantalla
function render_historial() {

    // Lectura filtros activos
    const filtro_operacion = document.getElementById('filtro-operacion').value
    const filtro_trim = document.getElementById('filtro-trim').value

    // Filtro del array de movimientos
    let resultado = movimientos.filter(function(mov) {
        
        // Si hay filtro de operación y no coincide se excluye
        if (filtro_operacion && mov.operacion !== filtro_operacion) return false

        // Si hay filtro de trimestre y no coincide se excluye
        if (filtro_trim && getTrimestre(mov.fecha) !== filtro_trim) return false

        // Si pasa ambos filtros se incluye
        return true
    })

    // Orden para mas reciente primero
    resultado.sort(function(a, b){
        return new Date(b.fecha) - new Date(a.fecha)
    })

    // Referencia al contenedor
    const contenedor = document.getElementById('lista-movimientos')

    // Si no hay resultados mostramos un mensaje
    if (resultado.length === 0) {
        contenedor.innerHTML = '<div class="vacio">No hay movimientos</div>'
        return
    }

    // Crea el HTML de cada movimiento con template literals, .map() recorre el array y transforma cada elemento en otra cosa, en este caso cada movimiento en una string HTML
    const html = resultado.map(function(mov){
        const signo = mov.operacion === 'ingreso' ? '+' : '-'
        const etiqueta = { ingreso: 'Ingreso', gasto: 'Gasto', impuesto: 'Impuesto'}[mov.operacion]

        return `
            <div class="movimiento">
                <div class="mov-info">
                    <div class="mov-concepto">${mov.concepto}</div>
                    <div class="mov-detalle">${fecha_formateada(mov.fecha)} · ${etiqueta} · ${mov.num}</div>
                </div>
                <div class="mov-importe ${mov.operacion}">
                    ${signo}${mov.base.toFixed(2)} €
                </div>
                <button class="boton-editar" onclick="editar_movimiento(${mov.id})">✎</button>
                <button class="boton-borrar" onclick="borrar_movimiento(${mov.id})">✕</button>
            </div>
        `
    }) 
    
    // Juntar todos los strings en uno y se meten en el contenedor, .join('') une todos los elementos del array sin separador
    contenedor.innerHTML = '<div class="tarjeta">' + html.join('') + '</div>'
}

function borrar_movimiento(id) {
    //Confirmación
    if (!confirm('¿Seguro que quieres borrar este movimiento?')) return

    //filter devuelve array sin el elemento con ese id
    movimientos = movimientos.filter(function(mov) {
        return mov.id !== id
    })

    //Guardar array actualizado
    localStorage.setItem('movimientos', JSON.stringify(movimientos))

    //Actualizar historial y resumen
    render_historial()
    render_resumen()
}

//Editar movimiento
let modo_edicion = null

function editar_movimiento(id) {
    //Busco el movimiento por el id con find()
    const mov = movimientos.find(function(m) {return m.id === id})
    if (!mov) return

    //Guarda id een modo_edicion para saber que estamos editando
    modo_edicion = id

    //Rellena el formulario con los datos del movimiento
    document.getElementById('inp-concepto').value = mov.concepto
    document.getElementById('inp-base').value     = mov.base
    document.getElementById('inp-fecha').value    = mov.fecha
    document.getElementById('inp-num').value      = mov.num || ''
    if (mov.clienteId) {
        seleccionar_cliente(parseInt(mov.clienteId))
    } else {
        quitar_cliente()
    }

    document.getElementById('inp-iva').value      = mov.iva
    document.getElementById('inp-irpf').value     = mov.irpf
    document.getElementById('inp-amortizable').checked = mov.amortizable
    //Mostrar formulario amortización si check está activado
    if (mov.amortizable === true) {
        document.getElementById('campos-amortizacion').style.display = 'block'
    } else {
        document.getElementById('campos-amortizacion').style.display = 'none'
    }
    document.getElementById('inp-años-amort').value = mov.años_amort
    document.getElementById('inp-uso-profesional').value = mov.uso_profesional
    document.getElementById('inp-subtipo').value = mov.subtipo

    //Activa el botón de tipo de operación correcto
    operacion_actual = mov.operacion
    botones_operacion.forEach(function(b){
        b.classList.remove('activo')
        if (b.dataset.operacion === mov.operacion) b.classList.add('activo')      
    })

    mostrar_campos()
    
    document.getElementById('boton-cancelaredicion').style.display = 'block' 
    document.getElementById('boton-guardar').textContent = 'Guardar cambios'
           
    activar_pestaña('añadir')
}

function cancelar_edicionmovimiento() {
    modo_edicion = null
    document.getElementById('boton-guardar').textContent = 'Guardar movimiento'
    document.getElementById('boton-cancelaredicion').style.display = 'none'
    limpiar_movimiento()
    quitar_cliente()
    activar_pestaña('historial')
}

function activar_amortizacion() {
    const checked = document.getElementById('inp-amortizable').checked
    document.getElementById('campos-amortizacion').style.display = checked ? 'block' : 'none'
}


//Clientes

//Cargamos clientes de localStorage
let clientes = JSON.parse(localStorage.getItem('clientes')) || []

//Variable para saber si estamos editando cliente
let modo_edicioncliente = null

//Mostrar u ocultar el formulario de cliente
function mostrar_formulariocliente(id) {
    const form = document.getElementById('form-cliente')
    form.style.display = 'block'
    document.getElementById('boton-nuevocliente').style.display = 'none'

    //Si hay un id es que se está editando
    if(id) {
        modo_edicioncliente = id
        const cli = clientes.find(function(c) {return c.id === id})
    document.getElementById('cliente-nombre').value = cli.nombre
    document.getElementById('cliente-cif').value = cli.cif
    document.getElementById('cliente-direccion').value = cli.direccion
    document.getElementById('cliente-cp').value = cli.cp
    document.getElementById('cliente-ciudad').value = cli.ciudad
    document.getElementById('cliente-email').value = cli.email
    document.getElementById('cliente-tlf').value = cli.tlf
    document.getElementById('boton-guardarcliente').textContent = 'Guardar cambios'
    }    
}

function cancelar_formulariocliente() {
    ocultar_formulariocliente()
}

function ocultar_formulariocliente() {
    document.getElementById('form-cliente').style.display = 'none'
    document.getElementById('boton-nuevocliente').style.display = 'block'
    const modo_edicioncliente = null
    document.getElementById('boton-guardarcliente').textContent = 'Guardar cliente'

    //Limpiar formulario
    ;['cliente-nombre','cliente-cif','cliente-direccion','cliente-cp','cliente-ciudad','cliente-email','cliente-tlf']
    .forEach(function(id) {document.getElementById(id).value = ''})
}

function guardar_cliente() {
    const nombrecliente = document.getElementById('cliente-nombre').value.trim()
    const cif = document.getElementById('cliente-cif').value.trim()

    if (!nombrecliente) {alert('El nombre es obligatorio'); return}
    if (!cif) {alert('El CIF/NIF es obligatorio'); return}

    const cliente = {
        id: modo_edicioncliente || Date.now(),
        nombre: nombrecliente,
        cif: cif,
        direccion: document.getElementById('cliente-direccion').value.trim(),
        cp: document.getElementById('cliente-cp').value.trim(),
        ciudad: document.getElementById('cliente-ciudad').value.trim(),
        email: document.getElementById('cliente-email').value.trim(),
        tlf: document.getElementById('cliente-tlf').value.trim(),
    }

    if (modo_edicioncliente) {
        clientes = clientes.map(function(c) {
            return c.id === modo_edicioncliente ? cliente : c
        })
    } else {
        clientes.push(cliente)
    }

    localStorage.setItem('clientes', JSON.stringify(clientes))
    ocultar_formulariocliente()
    render_clientes()
}

function borrar_cliente(id) {
    if (!confirm('¿Quieres borrar este cliente?')) return
    clientes = clientes.filter(function(c) {return c.id !== id})
    localStorage.setItem('clientes', JSON.stringify(clientes))
    render_clientes()
}

function render_clientes() {
    const contenedor = document.getElementById('lista-clientes')

    if (clientes.length === 0) {
        contenedor.innerHTML = '<div class="vacio">No hay clientes todavía</div>'
        return
    }

    const html = clientes.map(function(cli){
        return `
            <div class="tarjeta">
                <div class="cliente-item">
                    <div class="cliente-item-info">
                        <div class="cliente-item-nombre">${cli.nombre}</div>
                        <div class="cliente-item-detalle">${cli.cif} · ${cli.ciudad || '—'}</div>
                    </div>
                    <div class="cliente-item-botones">
                        <button class="boton-editar" onclick="mostrar_formulariocliente(${cli.id})">✎</button>
                        <button class="boton-borrar" onclick="borrar_cliente(${cli.id})">✕</button>
                    </div>
                </div>
            </div>
        `
    }).join('')

    contenedor.innerHTML = html       
}

//Buscador de clientes
function filtrar_clientes() {
    const busqueda = document.getElementById('inp-cliente-buscar').value.toLowerCase
    const desplegable = document.getElementById('desplegable-clientes')

    //Si el campo está vacio no se muestra el desplegable
    if (!busqueda) {
        desplegable.style.display = 'none'
        return
    }

    //Filtramos por nombre o CIF
    const resultado = clientes.filter(function(cli) {
        return cli.nombre.toLowerCase().includes(busqueda) || cli.cif.toLowerCase().includes(busqueda)
    })

    if (resultado.length === 0) {
        desplegable.innerHTML = '<div class = "desplegable-item"><div class="cli-nombre">Sin resultados</div></div>'
        desplegable.style.display = 'block'
        return
    }

    desplegable.innerHTML = resultado.map(function(cli) {
        return `
            <div class="desplegable-item" onclick="seleccionar_cliente(${cli.id})">
                <div class="cliente-nombre">${cli.nombre}</div>
                <div class="cliente-cif">${cli.cif} · ${cli.ciudad || ''}</div>
            </div>
        `
    }).join('')

    desplegable.style.display = 'block'
}

function seleccionar_cliente(id) {
    const cliente = clientes.find(function(c) {return c.id === id})
    if (!cliente) return

    //Guardar el id en el campo oculto
    document.getElementById('inp-cliente-id').value = cliente.id

    //Ocultar el buscador y mostrar cliente seleccionado
    document.getElementById('inp-cliente-buscar').value = ''
    document.getElementById('desplegable-clientes').style.display = 'none'

    const seleccionado = document.getElementById('cliente-seleccionado')
    seleccionado.style.display = 'block'
    seleccionado.innerHTML = `
        <span class="cliente-quitar" onclick="quitar_cliente()">✕</span>
        <strong>${cliente.nombre}</strong><br>
        <span style="color:#888;font-siza:12px;">${cliente.cif} · ${cliente.direccion || ''} · ${cliente.ciudad || ''}</span>
    `
}

function quitar_cliente() {
    document.getElementById('inp-cliente-id').value =''
    document.getElementById('cliente-seleccionado').style.display = 'none'
    document.getElementById('inp-cliente-buscar').value = ''
}

//Configuración

//Cargar config de localStorage o valores por defecto
let config = JSON.parse(localStorage.getItem('config')) || {
    cuota: 200,
    irpf: 15,
    nuevo_autonomo: false,
    año_inicio: null,
    año_activacion: null,
}

function guardar_config() {
    config.cuota = parseFloat(document.getElementById('config-cuota').value) || 200
    config.irpf = parseInt(document.getElementById('config-irpf').value) || 15
    config.nuevo_autonomo = document.getElementById('config-nuevoautonomo').checked
    config.añoinicio = parseInt(document.getElementById('config-añoinicio').value) || null
    
    //Solo se guarda el año de activación si está activo y no estaba antes
    if (config.nuevo_autonomo && !config.año_activacion) {config.año_activacion = new Date().getFullYear()}
    if (!config.nuevo_autonomo) {config.año_activacion = null}

    localStorage.setItem('config', JSON.stringify(config))
    alert('Configuración guardada')
    render_resumen()
}

//Rellenar el valor de la cuota según lo puesto en la configuración
document.getElementById('inp-subtipo').addEventListener('change', function() {
    autocompletar_cuota()
})

function autocompletar_cuota() {
    const subtipo = document.getElementById('inp-subtipo').value
    const campo_base = document.getElementById('inp-base')
    if (subtipo === 'cuota' && (!campo_base.value || parseFloat(campo_base.value) === 0)) {
        campo_base.value = config.cuota
    }
}

function cargar_config() {
    document.getElementById('config-cuota').value = config.cuota || 200
    document.getElementById('config-irpf').value = config.irpf || 15
    
    const checkbox = document.getElementById('config-nuevoautonomo')
    checkbox.checked = config.nuevo_autonomo || false
    document.getElementById('campo-añoinicio').style.display = config.nuevo_autonomo ? 'block' : 'none'

    if (config.año_inicio) {
        document.getElementById('config-añoinicio').value = config.año_inicio
    }
}

//Mostrar u ocultar campo de año según checkbox
document.getElementById('config-nuevoautonomo').addEventListener('change', function(){
    document.getElementById('campo-añoinicio').style.display = this.checked ? 'block' : 'none'
})

function limpiar_datos() {
    if (!confirm('¿Borrar todos los movimientos? Esta acción no se puede deshacer')) {
        return
    }
        movimientos = []
        localStorage.setItem('movimientos', JSON.stringify(movimientos))
        render_historial()
        render_resumen()
        alert('Datos borrados')
}

function get_reduccion(año) {
    if (!config.nuevo_autonomo) return 1
    if (!config.año_activacion) return 1
    if (parseInt(año) < config.año_activacion) return 1

    const años_desdeinicio = parseInt(año) - config.año_inicio
    if (años_desdeinicio <= 1) return 0.4 
    if (años_desdeinicio === 2) return 0.7
    return 1
}


document.getElementById('sel-año').value  = new Date().getFullYear()
document.getElementById('sel-trim').value = getTrimestreActual()
años_disponibles()
render_historial()
render_resumen()
cargar_config()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
}