const name = require('../data/name');

module.exports = () => {return name[Math.floor(Math.random() * name.length)]};