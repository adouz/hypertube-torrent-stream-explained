/**
 * what's bittorrent: https://en.wikipedia.org/wiki/BitTorrent
 * 
 * what's trackers: https://qr.ae/pNfSEG
 * 
 * what's peers and seeds: https://qr.ae/pNfSEF
 * 
 * torrent-stream: https://github.com/mafintosh/torrent-stream (to download torrent file)
 * 
 * how to use createReadStream() to stream video to HTML5 video tag: https://betterprogramming.pub/video-stream-with-node-js-and-html5-320b3191a6b6
 * 
 * range-parser: https://www.npmjs.com/package/range-parser (to parse range)
 * 
 * fluent-ffmpeg: https://www.npmjs.com/package/fluent-ffmpeg (to convert non supported formats)
 * |___ fluent-ffmpeg uses ffmpeg that you have in your computer if you dont have it use '@ffmpeg-installer/ffmpeg'
 * 
 */

const logger = require('./logger'); // ignore this, its just a fancy console.log
const torrentStream = require('torrent-stream');
const parseRange = require('range-parser');
const ffmpeg = require('fluent-ffmpeg');

module.exports = (req, res) => {
    /**
     * its up to you on how you going to get the magnet link from client
     */
    var torrentId = 'magnet:?xt='+req.query.xt;
    logger.info(`magnet link ${torrentId}`);
    /**
     * lets create an engine of the torrent 
     * path: is where we are saving the file
     * trackers: is the trackers that come with the magnet link
     */
    const engine = torrentStream(torrentId, {
        path: '/Users/adouz/Desktop/tt/',
        trackers: req.query.tr
    });
    /**
     * engine.on('ready', () =>{}) is event listener  that will trigger when the engine is ready
     */
    engine.on('ready', () => {
        let large = 0;
        for (let i = 0; i < engine.files.length; i++) {
            console.log('filename:', engine.files[i].name, 'length:', engine.files[i].length);
            /**
             * get largest file because is going to be the video file
             */
            if (engine.files[i].length > engine.files[large].length) large = i;
        }
        const videoFile = engine.files[large];
        /**
         * exetract file extension from videFile.name
         * we going to need this to know if we can stream the video directly 
         * or we will have to convert it first
         * browser supported formats: (.ogg/.ogv) .mp4 .webm
         * other format you will have to convert it to a supported format
         */
        const re = /(?:\.([^.]+))?$/;
        const ext = re.exec(videoFile.name)[1];
        console.log('largest file:: filename:', videoFile.name, 'length:', videoFile.length, 'extension:', ext);
        /**
         * to start file download we call videoFile.select();
         */
        videoFile.select();
        /**
         * if its first time that we get request we will not have range header
         * so we just start streaming video for html5 video and he will send us back a request with range header
         * then we start string using the range header
         */
        if (req.headers.range){
            console.log(`range: ${req.headers.range}`);
            /**
             * we use parseRange to parse the range for us
             */
            const range = parseRange(videoFile.length, req.headers.range)[0];
            /**
             * if theres somthing wrong with range we will response with 415
             */
            if (ranges.type !== 'bytes' && ranges === -1 && ranges === -2) 
                return res.status(415).end(); //415 Unsupported Media Type
            console.log(range);
            /**
             * 206 status code is needed to tell the browser that the body containes the requested range of data
             */
            res.status(206);
            /**
             * and we set the necessary headers to describe our range of data
             */
            res.set({
                'Content-Range': `bytes ${range.start}-${range.end}/${videoFile.length}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': (range.end - range.start) + 1,
            })
            /**
             * check if file is a supported video format
             */
            if (['mp4', 'webm', 'ogv', 'ogg'].includes(ext)) {
                /**
                 * and take the range.start and range.end pass it to createReadStream so it will return a stream file at the requested range
                 */
                let stream = videoFile.createReadStream({ start: range.start, end: range.end });
                /**
                 * set type of content we are streaming
                 */
                res.set({
                    'Content-Type': `video/${ext === 'ogv' ? 'ogg' : ext }`,
                })
                stream.pipe(res);
            }else if (ext === 'mkv'){
                /**
                 * this if the file is not a supported video format
                 * we will have to convert to a supported format like .webm
                 */
                let stream = videoFile.createReadStream({ start: range.start, end: range.end });
                res.set({
                    'Content-Type': `video/webm`,
                })
                /**
                 * TODO: convert to webm using fluent-ffmpeg and stream
                 */

            }else return res.status(415).end(); //415 Unsupported Media Type
        }else{
            /**
             * this if the browser didnt send us the range header
             * we will just send a stream to it so he will send us range header and start streaming
             * we call videoFile.createReadStream() and it will create a readable stream file
             */
            logger.info(`firt request`);
            let stream = videoFile.createReadStream();
            res.status(200);
            stream.pipe(res);
        }
        
    })
    /**
     * those are other event listeners to just debug and you dont need them!
     */
    engine.on('download', (i) => { logger.info(`download ${i}`) });
    engine.on('upload', (i) => { logger.info(`upload ${i}`) });
    engine.on('torrent', (i) => { logger.info(`torrent ${i}`) });

};

