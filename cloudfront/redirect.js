// CloudFront Function on distribution E3GM861BKPK1L2 (viewer request)
// Sends www.andrewmacheret.com to andrewmacheret.com so Google sees one copy of each page
function handler(event) {
  var request = event.request;
  if (request.headers.host.value !== 'www.andrewmacheret.com') {
    return request;
  }
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: 'https://andrewmacheret.com' + request.uri } },
  };
}
