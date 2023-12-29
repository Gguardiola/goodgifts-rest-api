module.exports = (text) => {
    return text.split('"').map((part, index) => {return index % 2 === 0 ? encodeURIComponent(part) : part;}).join('')
};
