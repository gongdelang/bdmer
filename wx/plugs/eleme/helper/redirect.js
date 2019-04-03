const axios = require('axios');

module.exports = async url => {
  try {
    const res = await axios(url);
    return res.request.res.responseUrl;
  } catch (e) {
    return url;
  }
};
