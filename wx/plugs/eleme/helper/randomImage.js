const image = require('../data/image');

module.exports = () => {return image[Math.floor(Math.random() * image.length)]};