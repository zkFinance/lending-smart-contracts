function calculateExchangeRate(underlyingDecimals) {
    return "200000000".padEnd(Number(underlyingDecimals) + 9, 0)
}

module.exports = {
    calculateExchangeRate
};
