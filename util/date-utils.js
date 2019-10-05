function timestampToReadable(timestamp) {
    timestamp = String(timestamp);
    if (timestamp.length === 10) {
        timestamp += '000';
    } else if (timestamp.length !== 13) {
        throw new Error('error length of timestamp');
    }
    const d = new Date(parseInt(timestamp));
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

module.exports = {
    timestampToReadable
};