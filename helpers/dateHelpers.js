import moment from "moment";

export function isInMarketHours() {
  //check if current time is between 08:00 and 18:00
  const now = moment();
  const marketOpen = moment().hour(8).minute(0).second(0);
  const marketClose = moment().hour(18).minute(0).second(0);
  return now.isBetween(marketOpen, marketClose);
}

export function isToday(date) {
  return moment.utc(date).isSame(moment(), "day");
}

export function diffInHours(date) {
  return moment().diff(moment(date), "hours");
}
