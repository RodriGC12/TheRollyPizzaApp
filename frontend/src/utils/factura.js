import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generarTicketPDF(orden, productos) {
    const W = 80
    const margin = 5
    const obsCount = productos.filter(p => p.observacion).length
    const pageH = Math.max(58 + (productos.length * 8) + (obsCount * 5) + 42, 120)
    const doc = new jsPDF({ unit: 'mm', format: [W, pageH] })

    // ── HEADER OSCURO ─────────────────────────────────────────────
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, W, 50, 'F')
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 50, W, 1.2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('PARIS ROLLY PIZZA', W / 2, 11, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text('Restaurante de Pizzas y Más', W / 2, 17, { align: 'center' })
    doc.text('Tel: (503) 2222-3333  ·  San Salvador', W / 2, 22, { align: 'center' })

    // Badge PRE-CUENTA
    doc.setFillColor(59, 130, 246)
    doc.roundedRect(margin + 8, 26, W - margin * 2 - 16, 9, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('PRE-CUENTA', W / 2, 32, { align: 'center' })

    const ahora = new Date()
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(
        `${ahora.toLocaleDateString('es-SV')}  ${ahora.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}`,
        W / 2, 42, { align: 'center' }
    )

    // ── INFO DE MESA ──────────────────────────────────────────────
    let y = 56
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`Mesa ${orden.nro_mesa}`, margin, y)
    doc.setTextColor(80, 80, 80)
    doc.setFont('helvetica', 'normal')
    doc.text(`Orden #${orden.orden_id}`, W - margin, y, { align: 'right' })

    y += 5
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(`Atendido por: ${orden.mesero}`, margin, y)

    y += 4
    // Línea punteada
    for (let x = margin; x < W - margin; x += 3.5)
        doc.line(x, y, x + 2, y)

    // ── PRODUCTOS ────────────────────────────────────────────────
    y += 6
    productos.forEach(p => {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(20, 20, 20)
        const maxNombre = 26
        const nombre = p.producto.length > maxNombre ? p.producto.substring(0, maxNombre - 1) + '…' : p.producto
        doc.text(`${p.cantidad}x ${nombre}`, margin, y)
        doc.setFont('helvetica', 'bold')
        doc.text(`$${Number(p.subtotal).toFixed(2)}`, W - margin, y, { align: 'right' })

        if (p.observacion) {
            y += 4.5
            doc.setFontSize(6.5)
            doc.setFont('helvetica', 'italic')
            doc.setTextColor(120, 120, 120)
            doc.text(`   (${p.observacion})`, margin, y)
        }
        y += 8
    })

    // ── TOTAL ────────────────────────────────────────────────────
    y += 1
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.6)
    doc.line(margin, y, W - margin, y)
    y += 7

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('TOTAL:', margin, y)
    doc.setTextColor(22, 163, 74)
    doc.text(`$${Number(orden.total).toFixed(2)}`, W - margin, y, { align: 'right' })

    // ── FOOTER ───────────────────────────────────────────────────
    y += 8
    for (let x = margin; x < W - margin; x += 3.5)
        doc.line(x, y, x + 2, y)

    y += 6
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text('Este ticket no es válido como factura.', W / 2, y, { align: 'center' })
    y += 4.5
    doc.text('Solicite su factura oficial al cajero.', W / 2, y, { align: 'center' })

    y += 8
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bolditalic')
    doc.setTextColor(59, 130, 246)
    doc.text('¡Buen provecho!', W / 2, y, { align: 'center' })

    doc.save(`precuenta-mesa${orden.nro_mesa}-orden${orden.orden_id}.pdf`)
}

export function generarFacturaPDF(orden, productos) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()

    // ── HEADER ──────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, W, 48, 'F')

    // Línea de acento azul bajo el header
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 48, W, 1.5, 'F')

    // Nombre del restaurante
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(21)
    doc.setFont('helvetica', 'bold')
    doc.text('Paris Rolly Pizza', 14, 19)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text('Restaurante de Pizzas y Más', 14, 27)
    doc.text('Tel: (503) 2222-3333  ·  San Salvador, El Salvador', 14, 33)
    doc.text('NRC: 12345-6  ·  NIT: 0614-000000-000-0', 14, 39)

    // Título FACTURA (derecha)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURA', W - 14, 20, { align: 'right' })

    const numFactura = `#${String(orden.orden_id).padStart(6, '0')}`
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(59, 130, 246)
    doc.text(numFactura, W - 14, 30, { align: 'right' })

    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Orden válida como comprobante', W - 14, 38, { align: 'right' })

    // ── SECCIÓN DE DATOS ─────────────────────────────────────────────
    const infoY = 55
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, infoY, W - 28, 32, 3, 3, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.roundedRect(14, infoY, W - 28, 32, 3, 3, 'S')

    const fecha = new Date(orden.fecha_cierre || orden.fecha_creacion)
    const fechaStr = fecha.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const horaStr  = fecha.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })

    const col1 = 22
    const col2 = W / 2 + 8
    const lbl = [100, 116, 139]
    const val = [15, 23, 42]

    const filas = [
        ['Fecha:',    fechaStr,          'N° Orden:',  `#${orden.orden_id}`],
        ['Hora:',     horaStr,           'Mesa:',      `Mesa ${orden.nro_mesa}`],
        ['Mesero/a:', orden.mesero || '', '',            ''],
    ]

    filas.forEach((fila, i) => {
        const y = infoY + 10 + i * 8
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...lbl)
        doc.text(fila[0], col1, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...val)
        doc.text(fila[1], col1 + 22, y)
        if (fila[2]) {
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...lbl)
            doc.text(fila[2], col2, y)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...val)
            doc.text(fila[3], col2 + 22, y)
        }
    })

    // ── TABLA DE PRODUCTOS ───────────────────────────────────────────
    const tableY = infoY + 38

    autoTable(doc, {
        startY: tableY,
        margin: { left: 14, right: 14 },
        head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: productos.map(p => [
            p.observacion ? `${p.producto}\n(Obs: ${p.observacion})` : p.producto,
            { content: p.cantidad, styles: { halign: 'center' } },
            { content: `$${Number(p.precio_unitario).toFixed(2)}`, styles: { halign: 'right' } },
            { content: `$${Number(p.subtotal).toFixed(2)}`,        styles: { halign: 'right', fontStyle: 'bold' } },
        ]),
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [30, 41, 59],
            cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 18 },
            2: { cellWidth: 34 },
            3: { cellWidth: 34 },
        },
    })

    // ── TOTAL ────────────────────────────────────────────────────────
    const afterTable = doc.lastAutoTable.finalY + 6

    doc.setFillColor(15, 23, 42)
    doc.roundedRect(W - 82, afterTable, 68, 16, 3, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(148, 163, 184)
    doc.text('TOTAL A PAGAR', W - 76, afterTable + 7)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(74, 222, 128)
    doc.text(`$${Number(orden.total).toFixed(2)}`, W - 16, afterTable + 8.5, { align: 'right' })

    // ── FOOTER ───────────────────────────────────────────────────────
    const footerY = afterTable + 28
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.4)
    doc.line(14, footerY, W - 14, footerY)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bolditalic')
    doc.setTextColor(59, 130, 246)
    doc.text('¡Gracias por su preferencia!', W / 2, footerY + 9, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text('Paris Rolly Pizza — donde cada pizza cuenta una historia', W / 2, footerY + 16, { align: 'center' })
    doc.text(
        `Documento generado el ${new Date().toLocaleString('es-SV')}`,
        W / 2, footerY + 22, { align: 'center' }
    )

    doc.save(`factura-${numFactura}.pdf`)
}
