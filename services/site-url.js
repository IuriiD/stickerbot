let siteUrl = null;
module.exports = {
  save(url) {
    siteUrl = url;
  },
  retrieve() {
    return siteUrl;
  },
};
