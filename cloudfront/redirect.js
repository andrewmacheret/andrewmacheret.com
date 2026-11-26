// CloudFront Function on the default behavior of distribution E3GM861BKPK1L2 (viewer request)
// Gives every page one URL so Google doesn't index copies:
//   www.andrewmacheret.com/x -> andrewmacheret.com/x
//   /projects/cube           -> /projects/cube/
// S3 adds the slash itself, but with a temporary 302, so Google kept the no-slash URL
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  var uri = request.uri;
  var last = uri.slice(uri.lastIndexOf('/') + 1);
  var moved = false;

  if (host === 'www.andrewmacheret.com') {
    host = 'andrewmacheret.com';
    moved = true;
  }
  // no dot means a folder, not a file
  // resume* is left alone for the bucket's /resume -> /resume.pdf rule
  if (last !== '' && last.indexOf('.') === -1 && uri.indexOf('/resume') !== 0) {
    uri += '/';
    moved = true;
  }
  if (!moved) {
    return request;
  }

  var query = [];
  for (var name in request.querystring) {
    var param = request.querystring[name];
    var values = param.multiValue ? param.multiValue : [param];
    for (var i = 0; i < values.length; i++) {
      query.push(values[i].value === '' ? name : name + '=' + values[i].value);
    }
  }
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: 'https://' + host + uri + (query.length ? '?' + query.join('&') : '') },
    },
  };
}
