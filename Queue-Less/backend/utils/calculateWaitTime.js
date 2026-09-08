const calculateWaitTime = (peopleAhead = 0, serviceDurationMinutes = 15) => {
  if (peopleAhead <= 0) return 0;
  return peopleAhead * serviceDurationMinutes;
};

module.exports = calculateWaitTime;
