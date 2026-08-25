-- Expand the event-media bucket for Gallery photo and video uploads.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/gif','image/avif','image/bmp','image/tiff','image/svg+xml','image/heic','image/heif',
      'video/mp4','video/webm','video/quicktime','video/x-msvideo','video/ogg','video/mpeg','video/3gpp','video/x-matroska'
    ]
where id = 'event-media';
