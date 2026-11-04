// Run every test in a time zone with daylight-saving time so date/notification
// tests exercise DST transitions deterministically on any machine.
module.exports = async () => {
  process.env.TZ = 'America/New_York';
};
