#!/usr/bin/env node

const http = require('http');
const url = require('url');
const ytdl = require('@distube/ytdl-core');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const formatsList = [
  { name: 'MP3 - 320kbps', value: 'mp3_320' },
  { name: 'MP3 - 256kbps', value: 'mp3_256' },
  { name: 'MP3 - 128kbps', value: 'mp3_128' },
  { name: 'MP4 - 1080p', value: '1080p' },
  { name: 'MP4 - 720p', value: '720p' },
  { name: 'MP4 - 360p', value: '360p' },
];

const PORT = 8080;

function sanitizeTitle(title) {
  return title.replace(/[\/\\?%*:|"<>]/g, '-');
}

async function handleInfo(req, res, videoUrl) {
  try {
    const info = await ytdl.getInfo(videoUrl);
    const title = sanitizeTitle(info.videoDetails.title);
    const audioFormats = info.formats.filter(f => f.hasAudio && !f.hasVideo && f.audioBitrate);
    const videoFormats = info.formats.filter(f => f.hasAudio && f.hasVideo && f.container === 'mp4');

    const response = {
      title,
      formats: {
        mp3: {},
        mp4: {}
      }
    };

    for (const fmt of formatsList) {
      if (fmt.value.startsWith('mp3')) {
        const target = parseInt(fmt.value.split('_')[1], 10);
        let chosen = audioFormats.find(f => f.audioBitrate <= target);
        if (!chosen) chosen = audioFormats[audioFormats.length - 1];

        response.formats.mp3[fmt.value] = {
          approx: `${chosen.audioBitrate} kbps`,
          url: chosen.url
        };
      } else {
        const height = parseInt(fmt.value);
        let chosen = videoFormats.find(f => f.height && f.height <= height);
        if (!chosen) chosen = videoFormats[videoFormats.length - 1];

        response.formats.mp4[fmt.value] = {
          approx: `${chosen.height}p`,
          url: chosen.url
        };
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));

  } catch (err) {
    res.writeHead(500);
    res.end('Error fetching video info: ' + err.message);
  }
}

async function handleDownload(req, res, videoUrl, format) {
  try {
    const info = await ytdl.getInfo(videoUrl);
    const title = sanitizeTitle(info.videoDetails.title);

    if (format.startsWith('mp3')) {
      const targetBitrate = parseInt(format.split('_')[1], 10);
      const audioFormats = info.formats
        .filter(f => f.hasAudio && !f.hasVideo && f.audioBitrate)
        .sort((a, b) => b.audioBitrate - a.audioBitrate);

      let chosen = audioFormats.find(f => f.audioBitrate <= targetBitrate);
      if (!chosen) chosen = audioFormats[0];

      if (chosen.audioBitrate < targetBitrate) {
        // Re-encode using ffmpeg
        const output = `${title}_${targetBitrate}kbps.mp3`;
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${output}"`
        });

        const stream = ytdl(videoUrl, { format: chosen });

        ffmpeg(stream)
          .audioBitrate(targetBitrate)
          .format('mp3')
          .pipe(res)
          .on('error', err => {
            res.writeHead(500);
            res.end('FFmpeg error: ' + err.message);
          });

      } else {
        // Serve direct stream
        res.writeHead(302, { Location: chosen.url });
        res.end();
      }

    } else if (format.endsWith('p')) {
      const height = parseInt(format);
      const videoFormats = info.formats
        .filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4' && f.height)
        .sort((a, b) => b.height - a.height);

      let chosen = videoFormats.find(f => f.height <= height);
      if (!chosen) chosen = videoFormats[0];

      res.writeHead(302, { Location: chosen.url });
      res.end();
    } else {
      res.writeHead(400);
      res.end('Invalid format');
    }
  } catch (err) {
    res.writeHead(500);
    res.end('Download error: ' + err.message);
  }
}

http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const { pathname, query } = parsed;

  if (pathname === '/info' && query.url) {
    return handleInfo(req, res, query.url);
  }

  if (pathname === '/download' && query.url && query.format) {
    return handleDownload(req, res, query.url, query.format);
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Use /info?url=... or /download?url=...&format=...');
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
