const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const router = express.Router();

const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

// GET /api/stops
router.get('/stops', async (req, res) => {
    try {
        const stops = await readCSV('./src/data/stops.txt');
        res.json(stops);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer stops.txt' });
    }
});

// GET /api/routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await readCSV('./src/data/routes.txt');
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer routes.txt' });
    }
});

// GET /api/trips
router.get('/trips', async (req, res) => {
    try {
        const trips = await readCSV('./src/data/trips.txt');
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer trips.txt' });
    }
});

// GET /api/stop_times
router.get('/stop_times', async (req, res) => {
    try {
        const stopTimes = await readCSV('./src/data/stop_times.txt');
        res.json(stopTimes);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer stop_times.txt' });
    }
});

// GET /api/shapes/:shape_id
router.get('/shapes/:shape_id', async (req, res) => {
    try {
        const shapeId = req.params.shape_id;
        const shapes = await readCSV('./src/data/shapes.txt');
        const shapePoints = shapes
            .filter(s => s.shape_id === shapeId)
            .sort((a, b) => parseInt(a.shape_pt_sequence) - parseInt(b.shape_pt_sequence));
        res.json(shapePoints);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer shapes.txt' });
    }
});

// GET /api/trip/:trip_id
router.get('/trip/:trip_id', async (req, res) => {
    try {
        const tripId = req.params.trip_id;

        const [trips, stopTimes, stops, routes] = await Promise.all([
            readCSV('./src/data/trips.txt'),
            readCSV('./src/data/stop_times.txt'),
            readCSV('./src/data/stops.txt'),
            readCSV('./src/data/routes.txt')
        ]);

        const trip = trips.find(t => t.trip_id === tripId);
        const route = routes.find(r => r.route_id === trip.route_id);

        if (!trip) {
            return res.status(404).json({ error: `No se encontró trip con trip_id ${tripId}` });
        }

        // Buscar las stop_times de este trip
        const tripStopTimes = stopTimes
            .filter(st => st.trip_id === tripId)
            .sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));

        // Enlazar con la información de la parada (coordenadas y nombre)
        const enrichedStops = tripStopTimes.map(st => {
            const stop = stops.find(s => s.stop_id === st.stop_id);
            return {
                stop_id: st.stop_id,
                stop_sequence: st.stop_sequence,
                arrival_time: st.arrival_time,
                departure_time: st.departure_time,
                stop_name: stop?.stop_name || 'Desconocido',
                stop_lat: stop?.stop_lat || null,
                stop_lon: stop?.stop_lon || null
            };
        });

        res.json({
            ...trip,
            route: route,
            stop_times: enrichedStops
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al procesar los archivos GTFS' });
    }
});


module.exports = router;