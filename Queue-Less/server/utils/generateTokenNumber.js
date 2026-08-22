const generateTokenNumber = (prefix = 'A', sequenceNumber = 1) => {
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `${prefix}-${paddedNumber}`;
};

module.exports = generateTokenNumber;
