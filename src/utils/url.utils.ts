import url from 'url';

const getFullUrl = (req: any): string => {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl,
  });
}

export { getFullUrl };
