// Age as a whole number of COMPLETED years (always rounds down). A child who
// is 6 years and 11 months old is "6" — extra months never round up.
export function ageInYears(dobISO) {
  if (!dobISO) return null;
  const dob = new Date(dobISO);
  if (isNaN(dob)) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return Math.max(0, age);
}
