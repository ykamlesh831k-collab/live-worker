/**
 * LiveStream Pro 24/7 - Node.js FFmpeg Streaming Worker
 * Deploy on Render.com, Oracle Cloud (Always Free), Railway, or any Linux/Windows VPS.
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

function getFfmpegPath() {
    const candidates = [
        'ffmpeg',
        'C:\\Users\\hdlmp\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe',
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg'
    ];
    for (const c of candidates) {
        if (c !== 'ffmpeg' && fs.existsSync(c)) {
            return c;
        }
    }
    return 'ffmpeg';
}

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-Memory Streaming State
let activeStream = {
    isRunning: false,
    process: null,
    pid: null,
    startTime: null,
    rtmpUrl: null,
    quality: '720p',
    loop: true,
    logs: []
};

function addLog(msg) {
    const time = new Date().toISOString();
    activeStream.logs.push(`[${time}] ${msg}`);
    if (activeStream.logs.length > 100) activeStream.logs.shift();
    console.log(`[Worker] ${msg}`);
}

// Health Check (supports /, /health, /api/health)
const healthHandler = (req, res) => {
    res.json({
        status: 'ok',
        service: 'LiveStream Pro 24/7 FFmpeg Worker',
        uptime: process.uptime(),
        activeStream: activeStream.isRunning
    });
};
app.get('/', healthHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Stream Status
app.get('/api/status', (req, res) => {
    let uptimeSec = 0;
    if (activeStream.isRunning && activeStream.startTime) {
        uptimeSec = Math.floor((Date.now() - activeStream.startTime) / 1000);
    }
    res.json({
        isRunning: activeStream.isRunning,
        pid: activeStream.pid,
        uptimeSeconds: uptimeSec,
        quality: activeStream.quality,
        logs: activeStream.logs.slice(-20)
    });
});

// Start Stream
app.post('/api/start-stream', (req, res) => {
    const { rtmpUrl, streamKey, videoUrl, loop, quality } = req.body;

    if (!streamKey) {
        return res.status(400).json({ error: 'Stream key is required' });
    }

    if (activeStream.isRunning) {
        return res.status(409).json({
            error: 'A stream is already active',
            pid: activeStream.pid
        });
    }

    const fullRtmp = (rtmpUrl || 'rtmp://a.rtmp.youtube.com/live2').replace(/\/$/, '') + '/' + streamKey;
    const inputSource = videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    // FFmpeg Arguments for Zero-CPU 24/7 Passthrough RTMP streaming
    const isLoop = loop !== false;
    const ffmpegArgs = [
        '-re', // Real-time read
        ...(isLoop ? ['-stream_loop', '-1'] : []),
        '-i', inputSource,
        '-c:v', 'copy', // Stream copy video (ultra-low CPU usage!)
        '-c:a', 'aac',
        '-b:a', '160k',
        '-ar', '44100',
        '-f', 'flv',
        fullRtmp
    ];

    addLog(`Spawning FFmpeg process to: ${rtmpUrl || 'YouTube RTMP'}`);

    try {
        const ffmpegBin = getFfmpegPath();
        addLog(`Using FFmpeg binary at: ${ffmpegBin}`);
        const ffmpegProc = spawn(ffmpegBin, ffmpegArgs);

        activeStream.isRunning = true;
        activeStream.process = ffmpegProc;
        activeStream.pid = ffmpegProc.pid;
        activeStream.startTime = Date.now();
        activeStream.quality = quality || '720p';
        activeStream.loop = isLoop;

        ffmpegProc.stdout.on('data', (data) => {
            addLog(`[FFmpeg stdout] ${data.toString().trim()}`);
        });

        ffmpegProc.stderr.on('data', (data) => {
            const out = data.toString().trim();
            // FFmpeg logs progress to stderr
            if (out.includes('frame=') || out.includes('bitrate=')) {
                // Heartbeat
            } else {
                addLog(`[FFmpeg] ${out}`);
            }
        });

        ffmpegProc.on('close', (code) => {
            addLog(`FFmpeg process exited with code ${code}`);
            activeStream.isRunning = false;
            activeStream.process = null;
            activeStream.pid = null;
            activeStream.startTime = null;
        });

        ffmpegProc.on('error', (err) => {
            addLog(`FFmpeg spawn error: ${err.message}`);
            activeStream.isRunning = false;
            activeStream.process = null;
            activeStream.pid = null;
        });

        res.json({
            success: true,
            message: '24/7 Live Stream started successfully',
            pid: ffmpegProc.pid
        });

    } catch (err) {
        addLog(`Failed to start FFmpeg: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// Stop Stream
app.post('/api/stop-stream', (req, res) => {
    if (!activeStream.isRunning || !activeStream.process) {
        return res.json({ message: 'No active stream to stop' });
    }

    addLog(`Stopping stream (PID: ${activeStream.pid})...`);
    try {
        activeStream.process.kill('SIGINT');
        setTimeout(() => {
            if (activeStream.process) {
                activeStream.process.kill('SIGKILL');
            }
        }, 3000);

        activeStream.isRunning = false;
        activeStream.process = null;
        activeStream.pid = null;

        res.json({ success: true, message: 'Stream stopped successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`LiveStream Pro 24/7 Worker running on port ${PORT}`);
    console.log(`Ready for 24/7 YouTube Live Ingestion`);
    console.log(`====================================================`);
});
