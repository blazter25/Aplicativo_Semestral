import prisma from '@/lib/prisma'
import {NextResponse} from 'next/server'
import type {partidos_ronda} from '@prisma/client'

const mapRondas: Record<partidos_ronda, string> = {
    Grupos: "Grupos",
    Treintaydoavos: "32avos",
    Dieciseisavos: "16avos",
    Octavos: "Octavos",
    Cuartos: "Cuartos",
    Semifinal: "Semifinal",
    Final: "Final",
    Campe_n: "Campeón"
};

function mapEnumToRondaValor(valor: partidos_ronda | null): string {
    if (!valor) return "N/A";
    return mapRondas[valor];
}


export async function GET(request: Request) {
    try {
        const {searchParams} = new URL(request.url)
        const page = Number(searchParams.get('page') || 1)
        const limit = Number(searchParams.get('limit') || 10)
        const skip = (page - 1) * limit
        const torneoiD = searchParams.get('torneo_id')

        // Filtro por categoría
        const where = torneoiD ? { torneo_id: Number(torneoiD) } : {}

        const [partidos, total] = await Promise.all([
            prisma.partidos.findMany({
                where,
                skip,
                take: limit,
                include: {
                    jugadores_partidos_jugador1_idTojugadores: true,
                    jugadores_partidos_jugador2_idTojugadores: true,
                    jugadores_partidos_ganador_idTojugadores: true,
                    torneos: true
                }
            }),
            prisma.partidos.count({where})
        ]);

        const partidosFormateados = partidos.map(partido => ({
            id: partido.id,
            jugador1Nombre: partido.jugadores_partidos_jugador1_idTojugadores?.nombre ?? 'N/A',
            jugador2Nombre: partido.jugadores_partidos_jugador2_idTojugadores?.nombre ?? 'N/A',
            ganadorNombre: partido.jugadores_partidos_ganador_idTojugadores?.nombre ?? 'N/A',
            torneoNombre: partido.torneos?.nombre ?? 'N/A',
            fecha: partido.fecha ? new Date(partido.fecha).toLocaleDateString() : 'N/A',
            ronda: mapEnumToRondaValor(partido.ronda)
        }));

        return NextResponse.json({partidos: partidosFormateados, total});
        // En la función POST
    } catch (error: any) {
        // Intenta parsear el body para tener más contexto en el log
        const body = await request.text().catch(() => 'No se pudo leer el body');

        console.error('Error al crear el partido:', {
            message: error.message,
            stack: error.stack,
            receivedData: body, // Loguea lo que recibiste
        });

        return NextResponse.json(
            {error: "Error al crear partido", details: error.message},
            {status: 500}
        );
    }

}

export async function POST(request: Request) {
    let data;
    try {
        data = await request.json();
        const {jugador1_id, jugador2_id, ganador_id, torneo_id, ronda} = data;
        if (!ronda) {
            return NextResponse.json({error: "El campo 'ronda' es requerido"}, {status: 400});
        }
        if (!jugador1_id || !ganador_id || !torneo_id) {
            return NextResponse.json({error: "Los campos 'jugador1_id', 'ganador_id' y 'torneo_id' son requeridos"}, {status: 400});
        }

        const j1 = parseInt(jugador1_id);
        const j2 = jugador2_id ? parseInt(jugador2_id) : null;
        const g = parseInt(ganador_id);
        const t = parseInt(torneo_id);

        if (isNaN(j1) || (jugador2_id && isNaN(j2 as number)) || isNaN(g) || isNaN(t)) {
            return NextResponse.json({error: "Los IDs deben ser números válidos."}, {status: 400});
        }

        await prisma.$executeRawUnsafe(`
      CALL procesar_partido(
        ${j1},
        ${j2 !== null ? j2 : 'NULL'},
        ${g},
        ${t},
        '${ronda}',
        ${data.tipo_especial ? `'${data.tipo_especial}'` : 'NULL'}
      )
    `);

        return NextResponse.json({message: "Partido procesado exitosamente"}, {status: 201});

    } catch (error: any) {
        console.error('Error al procesar el partido:', {
            message: error.message,
            stack: error.stack,
            receivedData: data || 'No se pudo leer el body del request',
        });

        const errorMessage = error.code === 'P2003'
            ? 'Error de clave foránea: Uno de los IDs de jugador o torneo no existe.'
            : 'Error al procesar el partido en la base de datos.';

        return NextResponse.json(
            {error: errorMessage, details: error.message},
            {status: 500}
        );
    }
}


export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Length': '0'
        }
    });
}
